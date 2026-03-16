import BulkJob from '#models/bulk_job'
import {
  BULK_JOB_SCOPES,
  BULK_JOB_STATUSES,
  BULK_JOB_TYPES,
  type BulkJobScope,
  type BulkJobStatus,
  type BulkJobType,
} from '#shared/constants/bulk_job'
import { USERS_ROLES } from '#shared/constants/user'
import GenerateBulkPdfs from '#jobs/generate_bulk_pdfs'
import SendBulkEmails from '#jobs/send_bulk_emails'
import type { HttpContext } from '@adonisjs/core/http'

type CreateBulkJobBody = {
  employeeIds?: number[]
  template?: string
}

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

function computeScope(body: CreateBulkJobBody): BulkJobScope {
  const ids = Array.isArray(body.employeeIds) ? body.employeeIds : []
  if (ids.length === 0) {
    return BULK_JOB_SCOPES.ORG
  }
  if (ids.length === 1) {
    return BULK_JOB_SCOPES.SINGLE
  }
  return BULK_JOB_SCOPES.BATCH
}

export default class BulkJobsController {
  public async storeEmails({ auth, request, response }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized()
    }

    if (user.role === USERS_ROLES.EMPLOYEE) {
      return response.forbidden()
    }

    const rawBody = request.body() as CreateBulkJobBody
    const employeeIds = Array.isArray(rawBody.employeeIds)
      ? rawBody.employeeIds.map((id) => Number(id)).filter((id) => Number.isFinite(id))
      : undefined

    const scope = computeScope({ employeeIds })

    const bulkJob = await BulkJob.create({
      userId: user.id,
      organizationId: user.organizationId ?? null,
      type: BULK_JOB_TYPES.EMAILS,
      scope,
      status: BULK_JOB_STATUSES.PENDING,
      meta: {
        employeeIds,
        template: typeof rawBody.template === 'string' ? rawBody.template : undefined,
      },
    })

    await SendBulkEmails.dispatch({ bulkJobId: bulkJob.id }).toQueue('emails')

    return response.created(serializeBulkJob(bulkJob))
  }

  public async storePdfs({ auth, request, response }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized()
    }

    if (user.role === USERS_ROLES.EMPLOYEE) {
      return response.forbidden()
    }

    const rawBody = request.body() as CreateBulkJobBody
    const employeeIds = Array.isArray(rawBody.employeeIds)
      ? rawBody.employeeIds.map((id) => Number(id)).filter((id) => Number.isFinite(id))
      : undefined

    const scope = computeScope({ employeeIds })

    const bulkJob = await BulkJob.create({
      userId: user.id,
      organizationId: user.organizationId ?? null,
      type: BULK_JOB_TYPES.PDFS,
      scope,
      status: BULK_JOB_STATUSES.PENDING,
      meta: {
        employeeIds,
      },
    })

    await GenerateBulkPdfs.dispatch({ bulkJobId: bulkJob.id }).toQueue('pdfs')

    return response.created(serializeBulkJob(bulkJob))
  }

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

  public async show({ auth, params, response }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized()
    }

    const id = Number(params.id)
    if (!Number.isFinite(id)) {
      return response.notFound()
    }

    const job = await BulkJob.find(id)
    if (!job) {
      return response.notFound()
    }

    if (user.role === USERS_ROLES.SUPER_ADMIN) {
      // accès global
    } else if (user.role === USERS_ROLES.ADMIN || user.role === USERS_ROLES.ADVISOR) {
      if (job.organizationId !== user.organizationId) {
        return response.forbidden()
      }
    } else if (job.userId !== user.id) {
      return response.forbidden()
    }

    return response.json(serializeBulkJob(job))
  }
}
