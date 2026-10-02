import { makeEntitlements } from '#tests/support/entitlements'
import { ExpertRequestFactory } from '#database/factories/expert_request_factory'
import {
  ExpertAlreadyAssignedError,
  ExpertNotEligibleError,
  ExpertRequestAlreadyPendingError,
  ExpertRequestNotAvailableError,
  ExpertRequestNotFoundError,
  ExpertRequestNotPendingError,
  ExpertRequestRequiresPaymentError,
} from '#exceptions/expert_request_errors'
import { countQueries } from '#tests/utils/query_counter'
import { CandidateProfileNotFoundError } from '#exceptions/candidate_data_errors'
import Employee from '#models/employee'
import ExpertRequest from '#models/expert_request'
import type User from '#models/user'
import { CandidateNotificationsService } from '#services/candidate_notifications_service'
import { EntitlementsService } from '#services/entitlements_service'
import { ExpertRequestsService } from '#services/expert_requests_service'
import { PlatformOrganizationService } from '#services/platform_organization_service'
import { PlatformTeamService } from '#services/platform_team_service'
import { SuperAdminUsersService } from '#services/super_admin_users_service'
import { NotificationService } from '#services/notification_service'
import {
  EXPERT_REQUEST_STATUSES,
  EXPERT_SUPPORT_LOCK_REASONS,
} from '#shared/constants/expert_request'
import {
  createAdvisor,
  createB2cCandidate,
  createCandidate,
  createInHouseExpert,
  createSuperAdmin,
} from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

/** Notifications observées au lieu d'être écrites. */
class SpyNotifications extends CandidateNotificationsService {
  requested: Array<{ employeeId: number; requestId: number }> = []
  assigned: Array<{ employeeId: number; expertId: number }> = []
  candidateAssignments: Array<{ expertId: number; employeeId: number }> = []
  declined: Array<{ employeeId: number; reason: string }> = []
  constructor() {
    super(new NotificationService())
  }
  async expertRequested(employee: Employee, request: ExpertRequest) {
    this.requested.push({ employeeId: employee.id, requestId: request.id })
  }
  async expertAssigned(employee: Employee, expert: User) {
    this.assigned.push({ employeeId: employee.id, expertId: expert.id })
  }
  async candidateAssigned(expert: User, employee: Employee) {
    this.candidateAssignments.push({ expertId: expert.id, employeeId: employee.id })
  }
  async expertRequestDeclined(employee: Employee, reason: string) {
    this.declined.push({ employeeId: employee.id, reason })
  }
}

function makeService() {
  const notifications = new SpyNotifications()
  const team = new PlatformTeamService(
    new PlatformOrganizationService(),
    new SuperAdminUsersService({ sendSetPasswordLink: async () => {} } as any)
  )
  return {
    notifications,
    service: new ExpertRequestsService(makeEntitlements(), notifications, team),
  }
}

test.group('ExpertRequestsService.createForUser (#103)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('B2C payé : crée la demande (message et disponibilités nettoyés) et notifie', async ({
    assert,
  }) => {
    const { service, notifications } = makeService()
    const { user, employee } = await createB2cCandidate({ paid: true })

    const request = await service.createForUser(user, {
      message: '  Je veux construire mon plan.  ',
      availability: '   ',
    })

    assert.equal(request.employeeId, employee.id)
    assert.equal(request.organizationId, employee.organizationId)
    assert.equal(request.status, EXPERT_REQUEST_STATUSES.PENDING)
    assert.equal(request.message, 'Je veux construire mon plan.')
    assert.isNull(request.availability)
    assert.deepEqual(notifications.requested, [{ employeeId: employee.id, requestId: request.id }])
  })

  test('refuse un B2B (403), un B2C non payé (403) et un compte sans fiche (404)', async ({
    assert,
  }) => {
    const { service, notifications } = makeService()
    const input = { message: 'Un message assez long pour passer.' }

    const b2b = await createCandidate()
    await assert.rejects(
      () => service.createForUser(b2b.user, input),
      ExpertRequestNotAvailableError
    )
    const unpaid = await createB2cCandidate()
    await assert.rejects(
      () => service.createForUser(unpaid.user, input),
      ExpertRequestRequiresPaymentError
    )
    const advisor = await createAdvisor()
    await assert.rejects(() => service.createForUser(advisor, input), CandidateProfileNotFoundError)
    assert.lengthOf(notifications.requested, 0)
  })

  test('refuse un candidat qui a déjà un conseiller ou un expert (409)', async ({ assert }) => {
    const { service } = makeService()
    const actor = await createB2cCandidate({ paid: true })
    const otherExpert = await createInHouseExpert()
    actor.employee.advisorId = otherExpert.id
    await actor.employee.save()

    await assert.rejects(
      () => service.createForUser(actor.user, { message: 'Aidez-moi' }),
      ExpertAlreadyAssignedError
    )
  })

  test('une seule demande en attente : 409, mais possible après refus ou clôture', async ({
    assert,
  }) => {
    const { service } = makeService()
    const { user, employee } = await createB2cCandidate({ paid: true })
    const input = { message: 'Un message assez long pour passer.' }

    await service.createForUser(user, input)
    await assert.rejects(() => service.createForUser(user, input), ExpertRequestAlreadyPendingError)

    const [pending] = await service.listForEmployee(employee)
    assert.equal(pending.status, EXPERT_REQUEST_STATUSES.PENDING)
    await ExpertRequest.query().where('id', pending.id).update({
      status: EXPERT_REQUEST_STATUSES.DECLINED,
    })
    await assert.doesNotReject(() => service.createForUser(user, input))
    assert.lengthOf(await service.listForEmployee(employee), 2)
  })
})

test.group('ExpertRequestsService.supportViewFor (#103)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('B2B → b2b, B2C non payé → payment, B2C payé → éligible', async ({ assert }) => {
    const { service } = makeService()

    const b2bActor = await createCandidate()
    const b2b = await service.supportViewFor(b2bActor.user)
    assert.isFalse(b2b.eligible)
    assert.equal(b2b.lockedReason, EXPERT_SUPPORT_LOCK_REASONS.B2B)

    const unpaidActor = await createB2cCandidate()
    const unpaid = await service.supportViewFor(unpaidActor.user)
    assert.isFalse(unpaid.eligible)
    assert.equal(unpaid.lockedReason, EXPERT_SUPPORT_LOCK_REASONS.PAYMENT)

    const paidActor = await createB2cCandidate({ paid: true })
    const paid = await service.supportViewFor(paidActor.user)
    assert.deepEqual(paid, { eligible: true, lockedReason: null, request: null, expert: null })
  })

  test('expose la demande la plus récente et l’expert assigné (nom seul)', async ({ assert }) => {
    const { service } = makeService()
    const expert = await createInHouseExpert()
    const { user, employee } = await createB2cCandidate({ paid: true, expert })
    await ExpertRequestFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
      message: 'Ancienne',
    })
      .apply('declined')
      .create()
    const latest = await ExpertRequestFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
      message: 'Récente',
    })
      .apply('accepted')
      .create()

    const view = await service.supportViewFor(user)

    assert.equal(view.request?.id, latest.id)
    assert.equal(view.request?.message, 'Récente')
    assert.equal(view.request?.status, EXPERT_REQUEST_STATUSES.ACCEPTED)
    assert.isNotNull(view.request?.handledAt)
    assert.deepEqual(view.expert, { name: expert.name })
  })
})

test.group('ExpertRequestsService — back-office (#105)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function pendingRequest() {
    const candidate = await createB2cCandidate({ paid: true })
    const request = await ExpertRequestFactory.merge({
      employeeId: candidate.employee.id,
      organizationId: candidate.employee.organizationId,
    }).create()
    return { ...candidate, request }
  }

  test('assign : advisor_id, statut accepté, traçabilité, deux notifications', async ({
    assert,
  }) => {
    const { service, notifications } = makeService()
    const superAdmin = await createSuperAdmin()
    const expert = await createInHouseExpert()
    const { employee, request } = await pendingRequest()

    const updated = await service.assign(superAdmin, {
      requestId: request.id,
      expertUserId: expert.id,
    })

    assert.equal(updated.status, EXPERT_REQUEST_STATUSES.ACCEPTED)
    assert.equal(updated.assignedExpertUserId, expert.id)
    assert.equal(updated.handledByUserId, superAdmin.id)
    assert.isNotNull(updated.handledAt)
    const refreshed = await Employee.findOrFail(employee.id)
    assert.equal(refreshed.advisorId, expert.id)
    assert.deepEqual(notifications.assigned, [{ employeeId: employee.id, expertId: expert.id }])
    assert.deepEqual(notifications.candidateAssignments, [
      { expertId: expert.id, employeeId: employee.id },
    ])
  })

  test('assign : 422 hors équipe interne, 409 déjà traitée, 404 inconnue — sans effet', async ({
    assert,
  }) => {
    const { service, notifications } = makeService()
    const superAdmin = await createSuperAdmin()
    const clientAdvisor = await createAdvisor()
    const { employee, request } = await pendingRequest()

    await assert.rejects(
      () => service.assign(superAdmin, { requestId: request.id, expertUserId: clientAdvisor.id }),
      ExpertNotEligibleError
    )
    await assert.rejects(
      () => service.assign(superAdmin, { requestId: 999_999, expertUserId: clientAdvisor.id }),
      ExpertRequestNotFoundError
    )
    const expert = await createInHouseExpert()
    await service.decline(superAdmin, { requestId: request.id, reason: 'Plus tard.' })
    await assert.rejects(
      () => service.assign(superAdmin, { requestId: request.id, expertUserId: expert.id }),
      ExpertRequestNotPendingError
    )
    const refreshed = await Employee.findOrFail(employee.id)
    assert.isNull(refreshed.advisorId)
    assert.lengthOf(notifications.assigned, 0)
  })

  test('decline : motif nettoyé, traçabilité, candidat prévenu ; une seule fois', async ({
    assert,
  }) => {
    const { service, notifications } = makeService()
    const superAdmin = await createSuperAdmin()
    const { employee, request } = await pendingRequest()

    const updated = await service.decline(superAdmin, {
      requestId: request.id,
      reason: '  Aucun expert disponible.  ',
    })

    assert.equal(updated.status, EXPERT_REQUEST_STATUSES.DECLINED)
    assert.equal(updated.declineReason, 'Aucun expert disponible.')
    assert.equal(updated.handledByUserId, superAdmin.id)
    assert.deepEqual(notifications.declined, [
      { employeeId: employee.id, reason: 'Aucun expert disponible.' },
    ])
    await assert.rejects(
      () => service.decline(superAdmin, { requestId: request.id, reason: 'Encore.' }),
      ExpertRequestNotPendingError
    )
  })

  test('assign : candidat déjà suivi → 409 et demande clôturée, fiche soft-deleted → 404', async ({
    assert,
  }) => {
    const { service, notifications } = makeService()
    const superAdmin = await createSuperAdmin()
    const expert = await createInHouseExpert()
    const followed = await pendingRequest()
    const otherExpert = await createInHouseExpert()
    followed.employee.advisorId = otherExpert.id
    await followed.employee.save()

    await assert.rejects(
      () => service.assign(superAdmin, { requestId: followed.request.id, expertUserId: expert.id }),
      ExpertAlreadyAssignedError
    )
    const closed = await ExpertRequest.findOrFail(followed.request.id)
    assert.equal(closed.status, EXPERT_REQUEST_STATUSES.CLOSED)

    const deleted = await pendingRequest()
    deleted.employee.deletedAt = DateTime.now()
    await deleted.employee.save()
    await assert.rejects(
      () => service.assign(superAdmin, { requestId: deleted.request.id, expertUserId: expert.id }),
      ExpertRequestNotFoundError
    )
    assert.lengthOf(notifications.assigned, 0)
    const stillPending = await ExpertRequest.findOrFail(deleted.request.id)
    assert.equal(stillPending.status, EXPERT_REQUEST_STATUSES.PENDING)
  })

  test('listForAdmin : nombre de requêtes constant (pas de N+1)', async ({ assert }) => {
    const { service } = makeService()
    await pendingRequest()
    const few = await countQueries(() => service.listForAdmin())
    await pendingRequest()
    await pendingRequest()
    const many = await countQueries(() => service.listForAdmin())
    assert.equal(many, few)
  })

  test('listForAdmin : les plus récentes d’abord, avec candidat, droit, expert et traitant', async ({
    assert,
  }) => {
    const { service } = makeService()
    const superAdmin = await createSuperAdmin()
    const expert = await createInHouseExpert()
    const older = await pendingRequest()
    const newer = await pendingRequest()
    await service.assign(superAdmin, { requestId: newer.request.id, expertUserId: expert.id })

    const rows = await service.listForAdmin()

    assert.deepEqual(
      rows.map((r) => r.id),
      [newer.request.id, older.request.id]
    )
    assert.deepEqual(rows[0].candidate, {
      id: newer.employee.id,
      name: newer.employee.name,
      email: newer.employee.email,
      hasPaidAccess: true,
    })
    assert.deepEqual(rows[0].assignedExpert, { id: expert.id, name: expert.name })
    assert.deepEqual(rows[0].handledBy, { id: superAdmin.id, name: superAdmin.name })
    assert.isNull(rows[1].assignedExpert)
    assert.isNull(rows[1].handledBy)
  })
})
