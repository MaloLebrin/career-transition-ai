import { CandidatePaymentFactory } from '#database/factories/candidate_payment_factory'
import { EntitlementAlreadyGrantedError, PaymentNotFoundError } from '#exceptions/billing_errors'
import { CandidateProfileNotFoundError } from '#exceptions/candidate_data_errors'
import CandidatePayment from '#models/candidate_payment'
import type Employee from '#models/employee'
import { EntitlementsService } from '#services/entitlements_service'
import { PlatformOrganizationService } from '#services/platform_organization_service'
import { SuperAdminPaymentsService } from '#services/super_admin_payments_service'
import { PAYMENT_PROVIDERS, PAYMENT_STATUSES, PAYMENTS_PAGE_SIZE } from '#shared/constants/billing'
import { createB2cCandidate, createCandidate, createSuperAdmin } from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

/** Droits observés : ni job IA ni notification. */
class SpyEntitlements extends EntitlementsService {
  unlocked: number[] = []
  revoked: number[] = []
  protected async onResultsUnlocked(_employee: Employee, payment: CandidatePayment) {
    this.unlocked.push(payment.id)
  }
  protected async onResultsRevoked(_employee: Employee, payment: CandidatePayment) {
    this.revoked.push(payment.id)
  }
}

function makeService() {
  const entitlements = new SpyEntitlements()
  return {
    entitlements,
    service: new SuperAdminPaymentsService(new PlatformOrganizationService(), entitlements),
  }
}

test.group('SuperAdminPaymentsService (#107)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('parseFilter : statut connu ou null, page ≥ 1', ({ assert }) => {
    const { service } = makeService()
    assert.deepEqual(service.parseFilter({}), { status: null, page: 1 })
    assert.deepEqual(service.parseFilter({ status: 'paid', page: '3' }), {
      status: 'paid',
      page: 3,
    })
    assert.deepEqual(service.parseFilter({ status: 'bogus', page: '-2' }), {
      status: null,
      page: 1,
    })
    assert.deepEqual(service.parseFilter({ page: 'abc' }), { status: null, page: 1 })
  })

  test('list : tri, filtre par statut, pagination, candidat purgé affiché comme tel', async ({
    assert,
  }) => {
    const { service } = makeService()
    const { employee } = await createB2cCandidate()
    const first = await CandidatePaymentFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
    })
      .apply('paid')
      .create()
    const second = await CandidatePaymentFactory.merge({
      employeeId: null,
      userId: null,
      organizationId: employee.organizationId,
    })
      .apply('refunded')
      .create()

    const all = await service.list({ status: null, page: 1 })
    assert.deepEqual(
      all.items.map((p) => p.id),
      [second.id, first.id]
    )
    assert.equal(all.total, 2)
    assert.equal(all.lastPage, 1)
    assert.isNull(all.items[0].candidate)
    assert.deepEqual(all.items[1].candidate, {
      id: employee.id,
      name: employee.name,
      email: employee.email,
    })
    assert.isTrue(all.items[1].grantsAccess)
    assert.isFalse(all.items[0].grantsAccess)

    const paidOnly = await service.list({ status: PAYMENT_STATUSES.PAID, page: 1 })
    assert.deepEqual(
      paidOnly.items.map((p) => p.id),
      [first.id]
    )

    const beyond = await service.list({ status: null, page: 2 })
    assert.lengthOf(beyond.items, 0)
    assert.equal(beyond.total, 2)
    assert.isAtLeast(PAYMENTS_PAGE_SIZE, 10)
  })

  test('grant : octroi manuel pour un particulier de la plateforme ; 404 B2B / inconnu ; 409 déjà payé', async ({
    assert,
  }) => {
    const { service, entitlements } = makeService()
    const superAdmin = await createSuperAdmin()
    const { employee } = await createB2cCandidate()
    const b2b = await createCandidate()

    const payment = await service.grant(superAdmin, employee.id)
    assert.equal(payment.provider, PAYMENT_PROVIDERS.MANUAL)
    assert.equal(payment.grantedByUserId, superAdmin.id)
    assert.deepEqual(entitlements.unlocked, [payment.id])

    await assert.rejects(
      () => service.grant(superAdmin, employee.id),
      EntitlementAlreadyGrantedError
    )
    await assert.rejects(
      () => service.grant(superAdmin, b2b.employee.id),
      CandidateProfileNotFoundError
    )
    await assert.rejects(() => service.grant(superAdmin, 999_999), CandidateProfileNotFoundError)
  })

  test('revoke : motif consigné avec l’auteur, droit retiré ; inconnu → 404', async ({
    assert,
  }) => {
    const { service, entitlements } = makeService()
    const superAdmin = await createSuperAdmin()
    const { employee } = await createB2cCandidate({ paid: true })
    const [payment] = await CandidatePayment.query().where('employeeId', employee.id)

    const revoked = await service.revoke(superAdmin, { paymentId: payment.id, reason: 'Litige' })

    assert.isNotNull(revoked.revokedAt)
    assert.include(revoked.revokeReason ?? '', 'Litige')
    assert.include(revoked.revokeReason ?? '', `#${superAdmin.id}`)
    assert.deepEqual(entitlements.revoked, [payment.id])
    await assert.rejects(
      () => service.revoke(superAdmin, { paymentId: payment.id, reason: 'Encore' }),
      PaymentNotFoundError
    )
  })
})
