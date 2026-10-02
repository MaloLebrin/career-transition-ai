import Employee from '#models/employee'
import PdfExport from '#models/pdf_export'
import { EmployeeSynthesisPdfService } from '#services/employee_synthesis_pdf_service'
import { EmployeeSynthesisService } from '#services/employee_synthesis_service'
import { EntitlementsService } from '#services/entitlements_service'
import { broadcastPdfExportUpdatedToUsers } from '#services/pdf_export_events_service'
import { NotificationService } from '#services/notification_service'
import { PDF_MIME_TYPE, pdfExportKey, storePdf } from '#services/pdf_storage_service'
import { ACCOUNT_TYPES } from '#shared/constants/b2c'
import { PDF_EXPORT_STATUSES } from '#shared/constants/pdf_export'
import { NOTIFICATION_TYPES } from '#shared/constants/notifications'
import { QUEUE_NAMES } from '#utils/queues/queue_names'
import logger from '@adonisjs/core/services/logger'
import { Job } from '@adonisjs/queue'
import type { JobOptions } from '@adonisjs/queue/types'
import { DateTime } from 'luxon'

type GenerateEmployeeSynthesisPdfPayload = {
  pdfExportId: number
}

/** Motif consigné sur l'export quand le forfait d'un particulier n'ouvre plus les résultats (#101). */
export const RESULTS_LOCKED_MESSAGE =
  'Export annulé : l’accès aux résultats n’est plus ouvert (forfait non réglé ou remboursé).'

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

      // #101 : le droit d'un particulier a pu disparaître (remboursement,
      // révocation) entre la demande et l'exécution — échec propre, sans PDF.
      if (
        employee.accountType === ACCOUNT_TYPES.B2C &&
        !(await new EntitlementsService().hasResultsAccess(employee.id))
      ) {
        pdfExport.status = PDF_EXPORT_STATUSES.FAILED
        pdfExport.errorMessage = RESULTS_LOCKED_MESSAGE
        pdfExport.finishedAt = DateTime.now()
        await pdfExport.save()
        broadcastPdfExportUpdatedToUsers(pdfExport, notifyUserIds)
        logger.warn('GenerateEmployeeSynthesisPdf: accès aux résultats révoqué', {
          pdfExportId,
          employeeId: employee.id,
        })
        return
      }

      const synthesisService = new EmployeeSynthesisService()
      const payload = await synthesisService.buildForCandidate({
        organizationId: pdfExport.organizationId!,
        employeeId: employee.id,
      })

      const pdfService = new EmployeeSynthesisPdfService()
      const bytes = await pdfService.generateShareablePdf({ payload })

      const fileName = `Synthese_${employee.name.replace(/\s+/g, '_')}_${pdfExport.id}.pdf`
      // `public_id` Cloudinary : lisible par le web même quand le worker
      // tourne sur une autre machine.
      const key = pdfExportKey(pdfExport.organizationId!, pdfExport.id)
      const size = await storePdf(key, bytes)

      pdfExport.filePath = key
      pdfExport.fileName = fileName
      pdfExport.mimeType = PDF_MIME_TYPE
      pdfExport.size = size
      pdfExport.status = PDF_EXPORT_STATUSES.COMPLETED
      pdfExport.finishedAt = DateTime.now()
      await pdfExport.save()
      broadcastPdfExportUpdatedToUsers(pdfExport, notifyUserIds)

      const notifService = new NotificationService()
      for (const uid of notifyUserIds) {
        await notifService.notify({
          userId: uid,
          type: NOTIFICATION_TYPES.PDF_EXPORT_COMPLETED,
          title: `Export PDF prêt : ${fileName}`,
          body: 'Votre export PDF est disponible au téléchargement.',
          meta: { pdfExportId: pdfExport.id, employeeId: pdfExport.employeeId, fileName },
        })
      }
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
