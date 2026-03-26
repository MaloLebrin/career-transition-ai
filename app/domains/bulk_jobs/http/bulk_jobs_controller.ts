import BulkJob from '#models/bulk_job'
import {
  BULK_JOB_STATUSES,
  BULK_JOB_TYPES,
  type BulkJobScope,
  type BulkJobStatus,
  type BulkJobType,
} from '#shared/constants/bulk_job'
import { USERS_ROLES } from '#shared/constants/user'
import type { HttpContext } from '@adonisjs/core/http'

type BulkJobDto = {
  id: number
  userId: number
  organizationId: number | null
  type: BulkJobType
  scope: BulkJobScope
  status: BulkJobStatus
  errorMessage: string | null
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
}

function serializeBulkJob(job: BulkJob): BulkJobDto {
  return {
    id: job.id,
    userId: job.userId,
    organizationId: job.organizationId,
    type: job.type as BulkJobType,
    scope: job.scope as BulkJobScope,
    status: job.status as BulkJobStatus,
    errorMessage: job.errorMessage,
    createdAt: job.createdAt.toISO()!,
    startedAt: job.startedAt ? job.startedAt.toISO() : null,
    finishedAt: job.finishedAt ? job.finishedAt.toISO() : null,
  }
}

export default class BulkJobsController {
  public async index({ auth, request, inertia }: HttpContext) {
    const user = auth.user
    if (!user) {
      // Pour Inertia, on redirige plutôt vers login si possible, mais ici on gère le guard
      return
    }

    const qs = request.qs() as { status?: string; type?: string }

    let query = BulkJob.query()

    if (user.role === USERS_ROLES.SUPER_ADMIN) {
      // Vue globale, pas de filtre par défaut
    } else if (user.role === USERS_ROLES.ADMIN || user.role === USERS_ROLES.ADVISOR) {
      query = query.where('organizationId', user.organizationId)
    } else {
      query = query.where('userId', user.id)
    }

    if (qs.status && Object.values(BULK_JOB_STATUSES).includes(qs.status as BulkJobStatus)) {
      query = query.where('status', qs.status)
    }

    if (qs.type && Object.values(BULK_JOB_TYPES).includes(qs.type as BulkJobType)) {
      query = query.where('type', qs.type)
    }

    const jobRecords = await query.orderBy('createdAt', 'desc').limit(100)
    const jobs = jobRecords.map(serializeBulkJob)

    return (inertia as any).render('dashboard/BulkJobs', { jobs })
  }
}

