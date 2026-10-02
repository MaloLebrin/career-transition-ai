import { ExpertRequestFactory } from '#database/factories/expert_request_factory'
import {
  ExpertRequestAlreadyPendingError,
  ExpertRequestNotAvailableError,
  ExpertRequestRequiresPaymentError,
} from '#exceptions/expert_request_errors'
import { CandidateProfileNotFoundError } from '#exceptions/candidate_data_errors'
import type Employee from '#models/employee'
import ExpertRequest from '#models/expert_request'
import { CandidateNotificationsService } from '#services/candidate_notifications_service'
import { EntitlementsService } from '#services/entitlements_service'
import { ExpertRequestsService } from '#services/expert_requests_service'
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
} from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

/** Notifications observées au lieu d'être écrites. */
class SpyNotifications extends CandidateNotificationsService {
  requested: Array<{ employeeId: number; requestId: number }> = []
  constructor() {
    super(new NotificationService())
  }
  async expertRequested(employee: Employee, request: ExpertRequest) {
    this.requested.push({ employeeId: employee.id, requestId: request.id })
  }
}

function makeService() {
  const notifications = new SpyNotifications()
  return {
    notifications,
    service: new ExpertRequestsService(new EntitlementsService(), notifications),
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
