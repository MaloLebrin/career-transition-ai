import { CandidatePaymentFactory } from '#database/factories/candidate_payment_factory'
import CandidatePayment from '#models/candidate_payment'
import {
  BILLING_CURRENCY,
  PAYMENT_PRODUCTS,
  PAYMENT_PROVIDERS,
  PAYMENT_STATUSES,
} from '#shared/constants/billing'
import { createB2cCandidate } from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

/** #94 — table `candidate_payments` : factory, états, contraintes CHECK, FK SET NULL. */
test.group('CandidatePayment', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  /** Factory rattachée à un particulier fraîchement créé. */
  async function paymentsOf() {
    const actor = await createB2cCandidate()
    const keys = {
      employeeId: actor.employee.id,
      userId: actor.user.id,
      organizationId: actor.employee.organizationId,
    }
    return (overrides: Record<string, unknown> = {}) =>
      CandidatePaymentFactory.merge({ ...keys, ...overrides })
  }

  test('la factory crée un paiement Stripe en attente valide', async ({ assert }) => {
    const payments = await paymentsOf()
    const created = await payments().create()

    const row = await CandidatePayment.findOrFail(created.id)
    assert.equal(row.productCode, PAYMENT_PRODUCTS.RESULTS_ACCESS)
    assert.equal(row.provider, PAYMENT_PROVIDERS.STRIPE)
    assert.equal(row.status, PAYMENT_STATUSES.PENDING)
    assert.equal(row.currency, BILLING_CURRENCY)
    assert.match(row.stripeCheckoutSessionId ?? '', /^cs_test_/)
    assert.isFalse(row.grantsAccess)
  })

  test('états : paid ouvre l’accès, refunded et revoked le ferment, manual est payé à 0 €', async ({
    assert,
  }) => {
    // Un candidat par droit actif : l'index unique partiel interdit d'en cumuler (#109).
    const paid = await (await paymentsOf())().apply('paid').create()
    const refunded = await (await paymentsOf())().apply('refunded').create()
    const revoked = await (await paymentsOf())().apply('revoked').create()
    const manual = await (await paymentsOf())().apply('manual').create()

    assert.isTrue(paid.grantsAccess)
    assert.isNotNull(paid.withdrawalWaivedAt)
    assert.isFalse(refunded.grantsAccess)
    assert.isNotNull(refunded.refundedAt)
    assert.isFalse(revoked.grantsAccess)
    assert.equal(revoked.status, PAYMENT_STATUSES.PAID)
    assert.isTrue(manual.grantsAccess)
    assert.equal(manual.provider, PAYMENT_PROVIDERS.MANUAL)
    assert.equal(manual.amountCents, 0)
    assert.isNull(manual.stripeCheckoutSessionId)
  })

  test('index unique partiel : un seul paiement actif par candidat, les révoqués ne comptent pas', async ({
    assert,
  }) => {
    const payments = await paymentsOf()
    await payments().apply('paid').create()
    await payments().apply('revoked').create()
    await payments().apply('refunded').create()

    await assert.rejects(
      () => payments().apply('manual').create(),
      /candidate_payments_one_active_per_employee/
    )
  })

  test('CHECK : statut, fournisseur et produit hors enum refusés', async ({ assert }) => {
    const payments = await paymentsOf()

    await assert.rejects(
      () => payments({ status: 'gift' }).create(),
      /candidate_payments_status_check/
    )
    await assert.rejects(
      () => payments({ provider: 'paypal' }).create(),
      /candidate_payments_provider_check/
    )
    await assert.rejects(
      () => payments({ productCode: 'coaching' }).create(),
      /candidate_payments_product_code_check/
    )
  })

  test('deux paiements ne partagent jamais la même session Checkout', async ({ assert }) => {
    const payments = await paymentsOf()
    const first = await payments().create()

    await assert.rejects(
      () => payments({ stripeCheckoutSessionId: first.stripeCheckoutSessionId }).create(),
      /unique|duplicate/i
    )
  })

  test('la suppression du candidat conserve le paiement anonymisé (SET NULL)', async ({
    assert,
  }) => {
    const actor = await createB2cCandidate({ paid: true })
    const [payment] = await CandidatePayment.query().where('employeeId', actor.employee.id)

    await actor.employee.delete()
    await actor.user.delete()

    const kept = await CandidatePayment.findOrFail(payment.id)
    assert.isNull(kept.employeeId)
    assert.isNull(kept.userId)
    assert.equal(kept.status, PAYMENT_STATUSES.PAID)
    assert.equal(kept.amountCents, payment.amountCents)
  })
})
