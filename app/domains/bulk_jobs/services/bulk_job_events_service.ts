import BulkJob from '#models/bulk_job'
import transmit from '@adonisjs/transmit/services/main'

export function broadcastBulkJobUpdated(job: BulkJob) {
  const payload = {
    id: job.id,
    userId: job.userId,
    organizationId: job.organizationId,
    type: job.type,
    scope: job.scope,
    status: job.status,
    errorMessage: job.errorMessage,
    createdAt: job.createdAt.toISO(),
    startedAt: job.startedAt ? job.startedAt.toISO() : null,
    finishedAt: job.finishedAt ? job.finishedAt.toISO() : null,
  }

  // User-specific channel
  transmit.broadcast(`users/${job.userId}/bulk-jobs`, payload)

  // Organization-wide channel when organization is defined
  if (job.organizationId) {
    transmit.broadcast(`organizations/${job.organizationId}/bulk-jobs`, payload)
  }
}

