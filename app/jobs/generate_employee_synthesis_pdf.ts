import Employee from '#models/employee'
import PdfExport from '#models/pdf_export'
import { EmployeeSynthesisPdfService } from '#services/employee_synthesis_pdf_service'
import { EmployeeSynthesisService } from '#services/employee_synthesis_service'
import { broadcastPdfExportUpdatedToUsers } from '#services/pdf_export_events_service'
import { PDF_EXPORT_STATUSES } from '#shared/constants/pdf_export'
import { QUEUE_NAMES } from '#utils/queues/queue_names'
import logger from '@adonisjs/core/services/logger'
import { Job } from '@adonisjs/queue'
import type { JobOptions } from '@adonisjs/queue/types'
import { DateTime } from 'luxon'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

type GenerateEmployeeSynthesisPdfPayload = {
  pdfExportId: number
}

export default class GenerateEmployeeSynthesisPdf extends Job<GenerateEmployeeSynthesisPdfPayload> {
  static options: JobOptions = {
    queue: QUEUE_NAMES.pdfs,
    maxRetries: 2,
  }

  async execute() {
    const { pdfExportId } = this.payload
    const pdfExport = await PdfExport.findOrFail(pdfExportId)

    pdfExport.status = PDF_EXPORT_STATUSES.PROCESSING
    pdfExport.startedAt = DateTime.now()
    await pdfExport.save()

    const notifyUserIds: number[] = [pdfExport.userId]
    if (pdfExport.advisorUserId) notifyUserIds.push(pdfExport.advisorUserId)
    broadcastPdfExportUpdatedToUsers(pdfExport, notifyUserIds)

    try {
      const employee = await Employee.query()
        .where('id', pdfExport.employeeId)
        .where('organizationId', pdfExport.organizationId!)
        .firstOrFail()

      const synthesisService = new EmployeeSynthesisService()
      const payload = await synthesisService.buildForCandidate({
        organizationId: pdfExport.organizationId!,
        employeeId: employee.id,
      })

      const pdfService = new EmployeeSynthesisPdfService()
      const bytes = await pdfService.generateShareablePdf({ payload })

      const exportsDir = path.join(process.cwd(), 'tmp', 'exports')
      await mkdir(exportsDir, { recursive: true })

      const fileName = `Synthese_${employee.name.replace(/\s+/g, '_')}_${pdfExport.id}.pdf`
      const filePath = path.join(exportsDir, fileName)
      await writeFile(filePath, Buffer.from(bytes))

      const s = await stat(filePath)

      pdfExport.filePath = filePath
      pdfExport.fileName = fileName
      pdfExport.mimeType = 'application/pdf'
      pdfExport.size = s.size
      pdfExport.status = PDF_EXPORT_STATUSES.COMPLETED
      pdfExport.finishedAt = DateTime.now()
      await pdfExport.save()
      broadcastPdfExportUpdatedToUsers(pdfExport, notifyUserIds)
    } catch (error: any) {
      pdfExport.status = PDF_EXPORT_STATUSES.FAILED
      pdfExport.errorMessage =
        error?.message || 'Unknown error while generating employee synthesis PDF'
      pdfExport.finishedAt = DateTime.now()
      await pdfExport.save()
      broadcastPdfExportUpdatedToUsers(pdfExport, notifyUserIds)

      logger.error('GenerateEmployeeSynthesisPdf failed', {
        pdfExportId,
        error: error?.message,
      })

      throw error
    }
  }
}
