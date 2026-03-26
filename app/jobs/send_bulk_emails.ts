import BulkJob from '#models/bulk_job'
import { BULK_JOB_STATUSES, BULK_JOB_TYPES } from '#shared/constants/bulk_job'
import Employee from '#models/employee'
import { broadcastBulkJobUpdated } from '#domains/bulk_jobs/services/bulk_job_events_service'
import logger from '@adonisjs/core/services/logger'
import { Job } from '@adonisjs/queue'
import type { JobOptions } from '@adonisjs/queue/types'
import { DateTime } from 'luxon'

interface SendBulkEmailsPayload {
  bulkJobId: number
}

type EmailMeta = {
  employeeIds?: number[]
  organizationId?: number
  template?: string
}

export default class SendBulkEmails extends Job<SendBulkEmailsPayload> {
  static options: JobOptions = {
    queue: 'emails',
    maxRetries: 3,
  }

  async execute() {
    const { bulkJobId } = this.payload
    const bulkJob = await BulkJob.findOrFail(bulkJobId)

    if (bulkJob.type !== BULK_JOB_TYPES.EMAILS) {
      logger.warn('SendBulkEmails: skipping job with non-email type', {
        bulkJobId,
        type: bulkJob.type,
      })
      return
    }

    bulkJob.status = BULK_JOB_STATUSES.PROCESSING
    bulkJob.startedAt = DateTime.now()
    await bulkJob.save()
    broadcastBulkJobUpdated(bulkJob)

    try {
      const meta = (bulkJob.meta || {}) as EmailMeta
      const employeeIds = meta.employeeIds

      let employeesQuery = Employee.query().where('organizationId', bulkJob.organizationId!)
      if (Array.isArray(employeeIds) && employeeIds.length > 0) {
        employeesQuery = employeesQuery.whereIn('id', employeeIds)
      }

      const employees = await employeesQuery

      for (const employee of employees) {
        logger.info('SendBulkEmails: would send email', {
          bulkJobId,
          employeeId: employee.id,
          email: employee.email,
          template: meta.template || 'default',
        })
        // TODO: intégrer @adonisjs/mail ou un service d'envoi d'emails réel ici.
      }

      bulkJob.status = BULK_JOB_STATUSES.COMPLETED
      bulkJob.finishedAt = DateTime.now()
      await bulkJob.save()
      broadcastBulkJobUpdated(bulkJob)
    } catch (error: any) {
      bulkJob.status = BULK_JOB_STATUSES.FAILED
      bulkJob.errorMessage = error?.message || 'Unknown error while sending bulk emails'
      bulkJob.finishedAt = DateTime.now()
      await bulkJob.save()
      broadcastBulkJobUpdated(bulkJob)

      logger.error('SendBulkEmails failed', {
        bulkJobId,
        error: error?.message,
      })

      throw error
    }
  }
}
