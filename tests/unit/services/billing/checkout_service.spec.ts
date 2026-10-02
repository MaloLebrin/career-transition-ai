import { makeEntitlements } from '#tests/support/entitlements'
import billingConfig from '#config/billing'
import { CandidatePaymentFactory } from '#database/factories/candidate_payment_factory'
import {
  CheckoutSessionNotFoundError,
  EmailNotVerifiedError,
  EntitlementAlreadyGrantedError,
  PaymentsDisabledError,
} from '#exceptions/billing_errors'
import { CandidateProfileNotFoundError } from '#exceptions/candidate_data_errors'
import CandidatePayment from '#models/candidate_payment'
import { CheckoutService } from '#services/billing/checkout_service'
import { PaymentsService } from '#services/billing/payments_service'
import { EntitlementsService } from '#services/entitlements_service'
import {
  PAYMENT_PROVIDERS,
  PAYMENT_STATUSES,
  RESULTS_PRODUCT_NAME,
} from '#shared/constants/billing'
import { TERMS_VERSION } from '#shared/constants/legal'
import { createAdvisor, createB2cCandidate, createCandidate } from '#tests/support/actors'
import { FakeStripeGateway } from '#tests/support/fake_stripe'
import { withEnv } from '#tests/utils/env'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

function makeService() {
  const stripe = new FakeStripeGateway()
  const entitlements = makeEntitlements()
  return {
    stripe,
    service: new CheckoutService(stripe, entitlements, new PaymentsService(entitlements)),
    entitlements,
  }
}

/** `paymentsEnabled` est lu sur l'objet de config : on le bascule le temps du test. */
async function withPayments<T>(enabled: boolean, run: () => Promise<T>): Promise<T> {
  const previous = billingConfig.paymentsEnabled
  billingConfig.paymentsEnabled = enabled
  try {
    return await run()
  } finally {
    billingConfig.paymentsEnabled = previous
  }
}

test.group('CheckoutService.start (#102)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('crée un paiement pending, une session Stripe et renvoie son URL', async ({ assert }) => {
    const { service, stripe } = makeService()
    const { user, employee } = await createB2cCandidate({ emailVerified: true })

    const result = await withEnv({ APP_URL: 'https://app.example.test/' }, () =>
      withPayments(true, () => service.start(user))
    )

    assert.match(result.url, /^https:\/\/checkout\.stripe\.test\/pay\/cs_test_fake_/)
    const payment = await CandidatePayment.findOrFail(result.paymentId)
    assert.equal(payment.employeeId, employee.id)
    assert.equal(payment.userId, user.id)
    assert.equal(payment.organizationId, employee.organizationId)
    assert.equal(payment.provider, PAYMENT_PROVIDERS.STRIPE)
    assert.equal(payment.status, PAYMENT_STATUSES.PENDING)
    assert.equal(payment.amountCents, billingConfig.resultsPriceCents)
    assert.equal(payment.currency, billingConfig.currency)
    assert.equal(payment.stripeCheckoutSessionId, stripe.lastSessionId())
    assert.isNotNull(payment.withdrawalWaivedAt)

    assert.lengthOf(stripe.created, 1)
    const [input] = stripe.created
    assert.equal(input.paymentId, payment.id)
    assert.equal(input.employeeId, employee.id)
    assert.equal(input.customerEmail, user.email)
    assert.equal(input.productName, RESULTS_PRODUCT_NAME)
    assert.equal(
      input.successUrl,
      'https://app.example.test/dashboard/candidat/billing/success?session_id={CHECKOUT_SESSION_ID}'
    )
    assert.equal(input.cancelUrl, 'https://app.example.test/dashboard/candidat/billing/cancel')
    assert.notInclude(JSON.stringify(input), user.name)
  })

  test('réutilise le pending dont la session Stripe est ouverte (pas de nouveau paiement)', async ({
    assert,
  }) => {
    const { service, stripe } = makeService()
    const { user, employee } = await createB2cCandidate({ emailVerified: true })

    const first = await withPayments(true, () => service.start(user))
    const second = await withPayments(true, () => service.start(user))

    assert.deepEqual(second, first)
    assert.lengthOf(stripe.created, 1)
    assert.lengthOf(await CandidatePayment.query().where('employeeId', employee.id), 1)
  })

  test('session expirée : l’ancien pending est annulé et une nouvelle session créée', async ({
    assert,
  }) => {
    const { service, stripe } = makeService()
    const { user, employee } = await createB2cCandidate({ emailVerified: true })
    const first = await withPayments(true, () => service.start(user))
    stripe.expire(stripe.lastSessionId()!)

    const second = await withPayments(true, () => service.start(user))

    assert.notEqual(second.paymentId, first.paymentId)
    const old = await CandidatePayment.findOrFail(first.paymentId)
    assert.equal(old.status, PAYMENT_STATUSES.CANCELED)
    const pending = await CandidatePayment.query()
      .where('employeeId', employee.id)
      .where('status', PAYMENT_STATUSES.PENDING)
    assert.lengthOf(pending, 1)
  })

  test('Stripe en panne : pas de pending orphelin (failed), l’erreur remonte', async ({
    assert,
  }) => {
    const { service, stripe } = makeService()
    const { user, employee } = await createB2cCandidate({ emailVerified: true })
    stripe.failNextCreate = true

    await withPayments(true, () =>
      assert.rejects(() => service.start(user), 'FakeStripeGateway : panne simulée')
    )

    const payments = await CandidatePayment.query().where('employeeId', employee.id)
    assert.lengthOf(payments, 1)
    assert.equal(payments[0].status, PAYMENT_STATUSES.FAILED)
  })

  test('refuse quand le paiement est désactivé (503), sans rien créer', async ({ assert }) => {
    const { service, stripe } = makeService()
    const { user } = await createB2cCandidate({ emailVerified: true })

    await withPayments(false, () =>
      assert.rejects(() => service.start(user), PaymentsDisabledError)
    )
    assert.lengthOf(await CandidatePayment.all(), 0)
    assert.lengthOf(stripe.created, 0)
  })

  test('refuse un e-mail non vérifié (403)', async ({ assert }) => {
    const { service } = makeService()
    const { user } = await createB2cCandidate()

    await withPayments(true, () => assert.rejects(() => service.start(user), EmailNotVerifiedError))
    assert.lengthOf(await CandidatePayment.all(), 0)
  })

  test('refuse un particulier déjà payé (409)', async ({ assert }) => {
    const { service } = makeService()
    const { user } = await createB2cCandidate({ emailVerified: true, paid: true })

    await withPayments(true, () =>
      assert.rejects(() => service.start(user), EntitlementAlreadyGrantedError)
    )
  })

  test('refuse un candidat B2B et un conseiller (404)', async ({ assert }) => {
    const { service } = makeService()
    const { user: b2b } = await createCandidate()
    const advisor = await createAdvisor()

    await withPayments(true, async () => {
      await assert.rejects(() => service.start(b2b), CandidateProfileNotFoundError)
      await assert.rejects(() => service.start(advisor), CandidateProfileNotFoundError)
    })
  })
})

test.group('CheckoutService.reconcile (#102)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('session payée chez Stripe : marque le paiement payé et ouvre le droit', async ({
    assert,
  }) => {
    const { service, stripe, entitlements } = makeService()
    const { user, employee } = await createB2cCandidate({ emailVerified: true })
    const { paymentId } = await withPayments(true, () => service.start(user))
    const sessionId = stripe.lastSessionId()!
    stripe.pay(sessionId)

    const result = await service.reconcile(user, sessionId)

    assert.deepEqual(result, { paymentId, paid: true })
    const payment = await CandidatePayment.findOrFail(paymentId)
    assert.equal(payment.status, PAYMENT_STATUSES.PAID)
    assert.match(payment.stripePaymentIntentId ?? '', /^pi_test_fake_/)
    assert.isTrue(await entitlements.hasResultsAccess(employee.id))
    // Relu une fois chez Stripe ; une seconde réconciliation ne relit rien.
    assert.deepEqual(stripe.retrieved, [sessionId])
    assert.deepEqual(await service.reconcile(user, sessionId), { paymentId, paid: true })
    assert.deepEqual(stripe.retrieved, [sessionId])
  })

  test('session encore impayée : rien ne change', async ({ assert }) => {
    const { service, stripe, entitlements } = makeService()
    const { user, employee } = await createB2cCandidate({ emailVerified: true })
    const { paymentId } = await withPayments(true, () => service.start(user))

    const result = await service.reconcile(user, stripe.lastSessionId()!)

    assert.deepEqual(result, { paymentId, paid: false })
    assert.isFalse(await entitlements.hasResultsAccess(employee.id))
  })

  test('paiement révoqué, remboursé ou annulé : paid=false, sans relire Stripe', async ({
    assert,
  }) => {
    const { service, stripe } = makeService()
    const { user, employee } = await createB2cCandidate({ emailVerified: true })
    const make = (state: 'revoked' | 'refunded' | 'pending', sessionId: string) =>
      CandidatePaymentFactory.merge({
        employeeId: employee.id,
        userId: user.id,
        organizationId: employee.organizationId,
        stripeCheckoutSessionId: sessionId,
      })
        .apply(state)
        .create()
    const revoked = await make('revoked', 'cs_revoked')
    const refunded = await make('refunded', 'cs_refunded')
    const canceled = await make('pending', 'cs_canceled')
    canceled.status = PAYMENT_STATUSES.CANCELED
    await canceled.save()

    assert.deepEqual(await service.reconcile(user, 'cs_revoked'), {
      paymentId: revoked.id,
      paid: false,
    })
    assert.deepEqual(await service.reconcile(user, 'cs_refunded'), {
      paymentId: refunded.id,
      paid: false,
    })
    assert.deepEqual(await service.reconcile(user, 'cs_canceled'), {
      paymentId: canceled.id,
      paid: false,
    })
    assert.lengthOf(stripe.retrieved, 0)
  })

  test('session payée mais montant ou devise différents : rien n’est débloqué', async ({
    assert,
  }) => {
    const { service, stripe, entitlements } = makeService()
    const { user, employee } = await createB2cCandidate({ emailVerified: true })
    const { paymentId } = await withPayments(true, () => service.start(user))
    const sessionId = stripe.lastSessionId()!
    stripe.pay(sessionId)
    stripe.sessions.get(sessionId)!.amountTotal = 100

    assert.deepEqual(await service.reconcile(user, sessionId), { paymentId, paid: false })

    const payment = await CandidatePayment.findOrFail(paymentId)
    assert.equal(payment.status, PAYMENT_STATUSES.PENDING)
    assert.isFalse(await entitlements.hasResultsAccess(employee.id))
  })

  test('session inconnue, ou d’un autre particulier : 404', async ({ assert }) => {
    const { service, stripe } = makeService()
    const { user } = await createB2cCandidate({ emailVerified: true })
    const other = await createB2cCandidate({ emailVerified: true })
    await withPayments(true, () => service.start(other.user))
    const othersSession = stripe.lastSessionId()!
    stripe.pay(othersSession)

    await assert.rejects(
      () => service.reconcile(user, 'cs_test_unknown'),
      CheckoutSessionNotFoundError
    )
    await assert.rejects(() => service.reconcile(user, othersSession), CheckoutSessionNotFoundError)
    const payment = await CandidatePayment.query()
      .where('stripeCheckoutSessionId', othersSession)
      .firstOrFail()
    assert.equal(payment.status, PAYMENT_STATUSES.PENDING)
  })

  test('paiement disparu chez Stripe (session supprimée) : 404', async ({ assert }) => {
    const { service } = makeService()
    const { user, employee } = await createB2cCandidate({ emailVerified: true })
    await CandidatePaymentFactory.merge({
      employeeId: employee.id,
      userId: user.id,
      organizationId: employee.organizationId,
      stripeCheckoutSessionId: 'cs_test_orphan',
    }).create()

    await assert.rejects(
      () => service.reconcile(user, 'cs_test_orphan'),
      CheckoutSessionNotFoundError
    )
  })
})

test.group('CheckoutService.offerFor (#102)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('décrit l’offre pour le particulier connecté', async ({ assert }) => {
    const { service } = makeService()
    const unpaid = await createB2cCandidate()
    const paid = await createB2cCandidate({ emailVerified: true, paid: true })

    const offer = await service.offerFor(unpaid.user)
    assert.deepEqual(offer, {
      hasPaidAccess: false,
      emailVerified: false,
      paymentsEnabled: billingConfig.paymentsEnabled,
      priceCents: billingConfig.resultsPriceCents,
      currency: billingConfig.currency,
      termsVersion: TERMS_VERSION,
    })
    const paidOffer = await service.offerFor(paid.user)
    assert.isTrue(paidOffer.hasPaidAccess)
    assert.isTrue(paidOffer.emailVerified)
    const { user: b2b } = await createCandidate()
    await assert.rejects(() => service.offerFor(b2b), CandidateProfileNotFoundError)
  })
})
