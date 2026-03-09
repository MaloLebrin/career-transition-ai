import BulkJob, { BULK_JOB_STATUSES, BULK_JOB_TYPES } from '#models/bulk_job'
import Employee from '#models/employee'
import { buildDossierArchive, dossierZipFilename } from '#services/dossier_export_service'
import logger from '@adonisjs/core/services/logger'
import { Job } from '@adonisjs/queue'
import type { JobOptions } from '@adonisjs/queue/types'
import { DateTime } from 'luxon'

interface GenerateBulkPdfsPayload {
  bulkJobId: number
}

type PdfMeta = {
  employeeIds?: number[]
}

export default class GenerateBulkPdfs extends Job<GenerateBulkPdfsPayload> {
  static options: JobOptions = {
    queue: 'pdfs',
    maxRetries: 3,
  }

  async execute() {
    const { bulkJobId } = this.payload
    const bulkJob = await BulkJob.findOrFail(bulkJobId)

    if (bulkJob.type !== BULK_JOB_TYPES.PDFS) {
      logger.warn('GenerateBulkPdfs: skipping job with non-pdf type', {
        bulkJobId,
        type: bulkJob.type,
      })
      return
    }

    bulkJob.status = BULK_JOB_STATUSES.PROCESSING
    bulkJob.startedAt = DateTime.now()
    await bulkJob.save()

    try {
      const meta = (bulkJob.meta || {}) as PdfMeta
      const employeeIds = meta.employeeIds

      let employeesQuery = Employee.query().where('organizationId', bulkJob.organizationId!)
      if (Array.isArray(employeeIds) && employeeIds.length > 0) {
        employeesQuery = employeesQuery.whereIn('id', employeeIds)
      }

      const employees = await employeesQuery.preload('exerciseResults')

      for (const employee of employees) {
        const archive = await buildDossierArchive(employee)
        const filename = dossierZipFilename(employee.name)

        logger.info('GenerateBulkPdfs: dossier generated (in-memory)', {
          bulkJobId,
          employeeId: employee.id,
          filename,
        })

        archive.destroy()
      }

      bulkJob.status = BULK_JOB_STATUSES.COMPLETED
      bulkJob.finishedAt = DateTime.now()
      await bulkJob.save()
    } catch (error: any) {
      bulkJob.status = BULK_JOB_STATUSES.FAILED
      bulkJob.errorMessage = error?.message || 'Unknown error while generating bulk PDFs'
      bulkJob.finishedAt = DateTime.now()
      await bulkJob.save()

      logger.error('GenerateBulkPdfs failed', {
        bulkJobId,
        error: error?.message,
      })

      throw error
    }
  }
}
