import { CandidatePaymentFactory } from '#database/factories/candidate_payment_factory'
import type CandidatePayment from '#models/candidate_payment'
import type Employee from '#models/employee'
import { PaymentsService } from '#services/billing/payments_service'
import { EntitlementsService } from '#services/entitlements_service'
import { PAYMENT_STATUSES, STRIPE_REFUND_REVOKE_REASON } from '#shared/constants/billing'
import { createB2cCandidate } from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

/** `EntitlementsService` observé : on compte les déblocages notifiés. */
class SpyEntitlements extends EntitlementsService {
  unlocked: Array<{ employeeId: number; paymentId: number }> = []
  revoked: Array<{ employeeId: number; paymentId: number }> = []
  async unlockResults(employee: Employee, payment: CandidatePayment) {
    this.unlocked.push({ employeeId: employee.id, paymentId: payment.id })
  }
  async revokeResults(employee: Employee, payment: CandidatePayment) {
    this.revoked.push({ employeeId: employee.id, paymentId: payment.id })
  }
}

test.group('PaymentsService.markPaid (#102)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('passe un paiement pending en paid, trace l’intent, ouvre le droit une fois', async ({
    assert,
  }) => {
    const spy = new SpyEntitlements()
    const service = new PaymentsService(spy)
    const { employee } = await createB2cCandidate()
    const payment = await CandidatePaymentFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
    }).create()
    assert.isFalse(await spy.hasResultsAccess(employee.id))

    const changed = await service.markPaid(payment, { paymentIntentId: 'pi_test_1' })

    assert.isTrue(changed)
    await payment.refresh()
    assert.equal(payment.status, PAYMENT_STATUSES.PAID)
    assert.equal(payment.stripePaymentIntentId, 'pi_test_1')
    assert.isNotNull(payment.paidAt)
    assert.isTrue(await spy.hasResultsAccess(employee.id))
    assert.deepEqual(spy.unlocked, [{ employeeId: employee.id, paymentId: payment.id }])
  })

  test('idempotent : un second passage (webhook puis réconciliation) ne fait rien', async ({
    assert,
  }) => {
    const spy = new SpyEntitlements()
    const service = new PaymentsService(spy)
    const { employee } = await createB2cCandidate()
    const payment = await CandidatePaymentFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
    }).create()
    const paidAt = DateTime.now().minus({ minutes: 5 }).startOf('second')

    assert.isTrue(await service.markPaid(payment, { paymentIntentId: 'pi_first', paidAt }))
    assert.isFalse(await service.markPaid(payment, { paymentIntentId: 'pi_second' }))

    await payment.refresh()
    assert.equal(payment.stripePaymentIntentId, 'pi_first')
    assert.equal(payment.paidAt?.toISO(), paidAt.toISO())
    assert.lengthOf(spy.unlocked, 1)
  })

  test('ne touche pas un paiement déjà remboursé ou annulé', async ({ assert }) => {
    const spy = new SpyEntitlements()
    const service = new PaymentsService(spy)
    const { employee } = await createB2cCandidate()
    const refunded = await CandidatePaymentFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
    })
      .apply('refunded')
      .create()

    assert.isFalse(await service.markPaid(refunded, { paymentIntentId: 'pi_x' }))
    await refunded.refresh()
    assert.equal(refunded.status, PAYMENT_STATUSES.REFUNDED)
    assert.lengthOf(spy.unlocked, 0)
  })

  test('findByCheckoutSession retrouve le paiement par sa session', async ({ assert }) => {
    const service = new PaymentsService(new EntitlementsService())
    const { employee } = await createB2cCandidate()
    const payment = await CandidatePaymentFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
      stripeCheckoutSessionId: 'cs_test_lookup',
    }).create()

    const found = await service.findByCheckoutSession('cs_test_lookup')
    assert.equal(found?.id, payment.id)
    assert.isNull(await service.findByCheckoutSession('cs_test_unknown'))
  })
})

test.group('PaymentsService — échec, annulation, remboursement (#104)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function pendingFor(spy: SpyEntitlements) {
    const { employee } = await createB2cCandidate()
    const payment = await CandidatePaymentFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
    }).create()
    return { employee, payment, service: new PaymentsService(spy) }
  }

  test('markFailed et markCanceled ne partent que de pending', async ({ assert }) => {
    const spy = new SpyEntitlements()
    const { payment, service } = await pendingFor(spy)

    assert.isTrue(await service.markFailed(payment))
    assert.equal(payment.status, PAYMENT_STATUSES.FAILED)
    assert.isFalse(await service.markCanceled(payment))
    assert.isFalse(await service.markPaid(payment, { paymentIntentId: 'pi_late' }))
    await payment.refresh()
    assert.equal(payment.status, PAYMENT_STATUSES.FAILED)

    const { payment: other } = await pendingFor(spy)
    assert.isTrue(await service.markCanceled(other))
    assert.equal(other.status, PAYMENT_STATUSES.CANCELED)
    assert.lengthOf(spy.unlocked, 0)
  })

  test('refund : paid → refunded, dates et motif posés, droit retiré une seule fois', async ({
    assert,
  }) => {
    const spy = new SpyEntitlements()
    const { employee } = await createB2cCandidate()
    const payment = await CandidatePaymentFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
    })
      .apply('paid')
      .create()
    const service = new PaymentsService(spy)
    const refundedAt = DateTime.now().minus({ hours: 1 }).startOf('second')

    assert.isTrue(await service.refund(payment, { refundedAt }))
    assert.isFalse(await service.refund(payment))

    await payment.refresh()
    assert.equal(payment.status, PAYMENT_STATUSES.REFUNDED)
    assert.equal(payment.refundedAt?.toISO(), refundedAt.toISO())
    assert.isNotNull(payment.revokedAt)
    assert.equal(payment.revokeReason, STRIPE_REFUND_REVOKE_REASON)
    assert.isFalse(payment.grantsAccess)
    assert.deepEqual(spy.revoked, [{ employeeId: employee.id, paymentId: payment.id }])
  })

  test('refund ignore un paiement pending ou déjà remboursé', async ({ assert }) => {
    const spy = new SpyEntitlements()
    const { payment, service } = await pendingFor(spy)
    const { employee } = await createB2cCandidate()
    const refunded = await CandidatePaymentFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
    })
      .apply('refunded')
      .create()

    assert.isFalse(await service.refund(payment))
    assert.isFalse(await service.refund(refunded))
    assert.lengthOf(spy.revoked, 0)
  })

  test('findById et findByPaymentIntent', async ({ assert }) => {
    const service = new PaymentsService(new EntitlementsService())
    const { employee } = await createB2cCandidate()
    const payment = await CandidatePaymentFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
    })
      .apply('paid')
      .create()
    payment.stripePaymentIntentId = 'pi_lookup'
    await payment.save()

    const byId = await service.findById(payment.id)
    assert.equal(byId?.id, payment.id)
    assert.isNull(await service.findById(Number.NaN))
    assert.isNull(await service.findById(0))
    const byIntent = await service.findByPaymentIntent('pi_lookup')
    assert.equal(byIntent?.id, payment.id)
    assert.isNull(await service.findByPaymentIntent('pi_unknown'))
  })
})
