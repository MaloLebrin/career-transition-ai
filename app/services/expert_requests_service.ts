import { CandidateProfileNotFoundError } from '#exceptions/candidate_data_errors'
import {
  ExpertRequestAlreadyPendingError,
  ExpertRequestNotAvailableError,
  ExpertRequestRequiresPaymentError,
} from '#exceptions/expert_request_errors'
import Employee from '#models/employee'
import ExpertRequest from '#models/expert_request'
import type User from '#models/user'
import { CandidateNotificationsService } from '#services/candidate_notifications_service'
import { EntitlementsService } from '#services/entitlements_service'
import { ACCOUNT_TYPES } from '#shared/constants/b2c'
import {
  EXPERT_REQUEST_STATUSES,
  EXPERT_SUPPORT_LOCK_REASONS,
  type ExpertSupportLockReason,
} from '#shared/constants/expert_request'
import type { CreateExpertRequestInput } from '#shared/types/expert_request/inputs'
import type { ExpertRequestView, ExpertSupportView } from '#shared/types/expert_request/views'
import { inject } from '@adonisjs/core'

/**
 * Demandes d'accompagnement par un expert (#103), côté candidat.
 *
 * Réservées aux particuliers dont le forfait est réglé : un candidat B2B est
 * déjà accompagné par son conseiller (403), un particulier non payé passe par
 * l'offre (403). Une seule demande en attente à la fois (409, doublé d'un
 * index unique partiel). Les super admins sont notifiés ; l'assignation de
 * l'expert arrive avec #105.
 */
@inject()
export class ExpertRequestsService {
  constructor(
    private entitlements: EntitlementsService,
    private notifications: CandidateNotificationsService
  ) {}

  public async supportViewFor(user: User): Promise<ExpertSupportView> {
    const employee = await this.ownEmployee(user)
    await employee.load('advisor', (q) => q.select('id', 'name'))
    const lockedReason = await this.lockedReasonFor(employee)
    const latest = await ExpertRequest.query()
      .where('employeeId', employee.id)
      // Deux demandes créées dans la même milliseconde : l'id départage.
      .orderBy([
        { column: 'createdAt', order: 'desc' },
        { column: 'id', order: 'desc' },
      ])
      .first()

    return {
      eligible: lockedReason === null,
      lockedReason,
      request: latest ? toView(latest) : null,
      expert: employee.advisor ? { name: employee.advisor.name } : null,
    }
  }

  public async createForUser(user: User, input: CreateExpertRequestInput): Promise<ExpertRequest> {
    const employee = await this.ownEmployee(user)
    const lockedReason = await this.lockedReasonFor(employee)
    if (lockedReason === EXPERT_SUPPORT_LOCK_REASONS.B2B) throw new ExpertRequestNotAvailableError()
    if (lockedReason === EXPERT_SUPPORT_LOCK_REASONS.PAYMENT) {
      throw new ExpertRequestRequiresPaymentError()
    }

    const pending = await ExpertRequest.query()
      .where('employeeId', employee.id)
      .where('status', EXPERT_REQUEST_STATUSES.PENDING)
      .first()
    if (pending) throw new ExpertRequestAlreadyPendingError()

    const request = await ExpertRequest.create({
      employeeId: employee.id,
      organizationId: employee.organizationId,
      message: input.message.trim(),
      availability: input.availability?.trim() || null,
      status: EXPERT_REQUEST_STATUSES.PENDING,
    })

    await this.notifications.expertRequested(employee, request)
    return request
  }

  public async listForEmployee(employee: Employee): Promise<ExpertRequestView[]> {
    const rows = await ExpertRequest.query()
      .where('employeeId', employee.id)
      .orderBy([
        { column: 'createdAt', order: 'desc' },
        { column: 'id', order: 'desc' },
      ])
    return rows.map(toView)
  }

  private async lockedReasonFor(employee: Employee): Promise<ExpertSupportLockReason | null> {
    if (employee.accountType !== ACCOUNT_TYPES.B2C) return EXPERT_SUPPORT_LOCK_REASONS.B2B
    if (!(await this.entitlements.hasResultsAccess(employee.id))) {
      return EXPERT_SUPPORT_LOCK_REASONS.PAYMENT
    }
    return null
  }

  private async ownEmployee(user: User): Promise<Employee> {
    const employee = await Employee.query()
      .where('userId', user.id)
      .where('organizationId', user.organizationId)
      .whereNull('deletedAt')
      .first()
    if (!employee) throw new CandidateProfileNotFoundError()
    return employee
  }
}

function toView(request: ExpertRequest): ExpertRequestView {
  return {
    id: request.id,
    status: request.status,
    message: request.message,
    availability: request.availability,
    createdAt: request.createdAt.toISO()!,
    handledAt: request.handledAt?.toISO() ?? null,
    declineReason: request.declineReason,
  }
}
