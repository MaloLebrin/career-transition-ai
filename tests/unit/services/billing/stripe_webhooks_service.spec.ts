import { testNotifications } from '#tests/support/entitlements'
import { CandidatePaymentFactory } from '#database/factories/candidate_payment_factory'
import { StripeEventFactory } from '#database/factories/stripe_event_factory'
import { InvalidStripeSignatureError } from '#exceptions/billing_errors'
import type CandidatePayment from '#models/candidate_payment'
import type Employee from '#models/employee'
import StripeEvent from '#models/stripe_event'
import { PaymentsService } from '#services/billing/payments_service'
import { PromotionCodesService } from '#services/billing/promotion_codes_service'
import { StripeWebhooksService } from '#services/billing/stripe_webhooks_service'
import { EntitlementsService } from '#services/entitlements_service'
import { setErrorReporter, type ErrorContext } from '#services/error_tracking_service'
import {
  PAYMENT_STATUSES,
  STRIPE_WEBHOOK_EVENTS,
  WEBHOOK_OUTCOMES,
} from '#shared/constants/billing'
import type { PaymentGatewayWebhookEvent } from '#shared/types/billing/checkout'
import { createB2cCandidate } from '#tests/support/actors'
import {
  FAKE_STRIPE_SIGNATURE,
  FakeStripeGateway,
  fakeStripeEvent,
} from '#tests/support/fake_stripe'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

/** Droits observés : déblocages et retraits, sans job ni notification. */
class SpyEntitlements extends EntitlementsService {
  unlocked: number[] = []
  revoked: number[] = []
  async unlockResults(_employee: Employee, payment: CandidatePayment) {
    this.unlocked.push(payment.id)
  }
  async revokeResults(_employee: Employee, payment: CandidatePayment) {
    this.revoked.push(payment.id)
  }
}

let counter = 0
function event(
  type: string,
  object: Record<string, unknown>,
  id = `evt_test_${++counter}`
): PaymentGatewayWebhookEvent {
  return { id, type, livemode: false, data: { object } }
}

function makeService() {
  const entitlements = new SpyEntitlements(testNotifications())
  const payments = new PaymentsService(entitlements)
  const stripe = new FakeStripeGateway()
  const service = new StripeWebhooksService(stripe, payments, new PromotionCodesService(stripe))
  return { entitlements, payments, service, stripe }
}

async function pendingPayment(sessionId = 'cs_test_webhook') {
  const { employee } = await createB2cCandidate()
  return CandidatePaymentFactory.merge({
    employeeId: employee.id,
    organizationId: employee.organizationId,
    stripeCheckoutSessionId: sessionId,
  }).create()
}

test.group('StripeWebhooksService.handle (#104)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('signature invalide : rien n’est inscrit', async ({ assert }) => {
    const { service } = makeService()

    await assert.rejects(
      () => service.handle(JSON.stringify(event('checkout.session.completed', {})), 'bad'),
      InvalidStripeSignatureError
    )
    assert.lengthOf(await StripeEvent.all(), 0)
  })

  test('checkout.session.completed payé : paiement paid, droit ouvert, événement journalisé', async ({
    assert,
  }) => {
    const { service, entitlements } = makeService()
    const payment = await pendingPayment()
    const evt = event(STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED, {
      id: 'cs_test_webhook',
      client_reference_id: String(payment.id),
      payment_status: 'paid',
      payment_intent: 'pi_test_42',
    })

    const result = await service.handle(JSON.stringify(evt), FAKE_STRIPE_SIGNATURE)

    assert.deepEqual(result, {
      eventId: evt.id,
      type: evt.type,
      outcome: WEBHOOK_OUTCOMES.PROCESSED,
      paymentId: payment.id,
    })
    await payment.refresh()
    assert.equal(payment.status, PAYMENT_STATUSES.PAID)
    assert.equal(payment.stripePaymentIntentId, 'pi_test_42')
    assert.deepEqual(entitlements.unlocked, [payment.id])

    const [row] = await StripeEvent.all()
    assert.equal(row.stripeEventId, evt.id)
    assert.equal(row.type, evt.type)
    assert.isTrue(row.isProcessed)
  })

  test('rejeu du même événement : duplicate, aucun effet', async ({ assert }) => {
    const { service, entitlements } = makeService()
    const payment = await pendingPayment()
    const evt = event(STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED, {
      id: 'cs_test_webhook',
      client_reference_id: String(payment.id),
      payment_status: 'paid',
      payment_intent: 'pi_test_1',
    })

    await service.handle(JSON.stringify(evt), FAKE_STRIPE_SIGNATURE)
    const replay = await service.handle(JSON.stringify(evt), FAKE_STRIPE_SIGNATURE)

    assert.equal(replay.outcome, WEBHOOK_OUTCOMES.DUPLICATE)
    assert.lengthOf(entitlements.unlocked, 1)
    assert.lengthOf(await StripeEvent.all(), 1)
  })

  test('paiement retrouvé par l’id de session quand client_reference_id manque ; développé ou non', async ({
    assert,
  }) => {
    const { service } = makeService()
    const payment = await pendingPayment('cs_test_by_session')
    const evt = event(STRIPE_WEBHOOK_EVENTS.ASYNC_PAYMENT_SUCCEEDED, {
      id: 'cs_test_by_session',
      payment_status: 'paid',
      payment_intent: { id: 'pi_expanded' },
    })

    const result = await service.handle(JSON.stringify(evt), FAKE_STRIPE_SIGNATURE)

    assert.equal(result.paymentId, payment.id)
    await payment.refresh()
    assert.equal(payment.status, PAYMENT_STATUSES.PAID)
    assert.equal(payment.stripePaymentIntentId, 'pi_expanded')
  })

  test('completed encore unpaid (paiement différé) : rien ne change, l’événement est consommé', async ({
    assert,
  }) => {
    const { service, entitlements } = makeService()
    const payment = await pendingPayment()
    const evt = event(STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED, {
      id: 'cs_test_webhook',
      client_reference_id: String(payment.id),
      payment_status: 'unpaid',
    })

    const result = await service.handle(JSON.stringify(evt), FAKE_STRIPE_SIGNATURE)

    assert.equal(result.outcome, WEBHOOK_OUTCOMES.PROCESSED)
    await payment.refresh()
    assert.equal(payment.status, PAYMENT_STATUSES.PENDING)
    assert.lengthOf(entitlements.unlocked, 0)
  })

  test('async_payment_failed → failed, checkout.session.expired → canceled', async ({ assert }) => {
    const { service } = makeService()
    const failed = await pendingPayment('cs_failed')
    const expired = await pendingPayment('cs_expired')

    await service.handle(
      JSON.stringify(
        event(STRIPE_WEBHOOK_EVENTS.ASYNC_PAYMENT_FAILED, {
          id: 'cs_failed',
          client_reference_id: String(failed.id),
        })
      ),
      FAKE_STRIPE_SIGNATURE
    )
    await service.handle(
      JSON.stringify(event(STRIPE_WEBHOOK_EVENTS.CHECKOUT_EXPIRED, { id: 'cs_expired' })),
      FAKE_STRIPE_SIGNATURE
    )

    await failed.refresh()
    await expired.refresh()
    assert.equal(failed.status, PAYMENT_STATUSES.FAILED)
    assert.equal(expired.status, PAYMENT_STATUSES.CANCELED)
  })

  test('charge.refunded : paiement remboursé, droit retiré', async ({ assert }) => {
    const { service, entitlements } = makeService()
    const { employee } = await createB2cCandidate()
    const payment = await CandidatePaymentFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
    })
      .apply('paid')
      .create()
    // L'état `paid` pose son propre intent : on fixe celui que l'événement référence.
    payment.stripePaymentIntentId = 'pi_refund_me'
    await payment.save()

    const result = await service.handle(
      JSON.stringify(
        event(STRIPE_WEBHOOK_EVENTS.CHARGE_REFUNDED, {
          id: 'ch_test_1',
          payment_intent: 'pi_refund_me',
          refunded: true,
        })
      ),
      FAKE_STRIPE_SIGNATURE
    )

    assert.equal(result.outcome, WEBHOOK_OUTCOMES.PROCESSED)
    await payment.refresh()
    assert.equal(payment.status, PAYMENT_STATUSES.REFUNDED)
    assert.isNotNull(payment.refundedAt)
    assert.isNotNull(payment.revokedAt)
    assert.deepEqual(entitlements.revoked, [payment.id])
  })

  test('charge.refunded partiel : ignoré, droit conservé ; total par montants : révoqué', async ({
    assert,
  }) => {
    const { service, entitlements } = makeService()
    const { employee } = await createB2cCandidate()
    const payment = await CandidatePaymentFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
    })
      .apply('paid')
      .create()
    payment.stripePaymentIntentId = 'pi_partial_unit'
    await payment.save()
    const deliver = (object: Record<string, unknown>) =>
      service.handle(
        JSON.stringify(
          event(STRIPE_WEBHOOK_EVENTS.CHARGE_REFUNDED, {
            payment_intent: 'pi_partial_unit',
            ...object,
          })
        ),
        FAKE_STRIPE_SIGNATURE
      )

    const partial = await deliver({ amount: 4900, amount_refunded: 1000, refunded: false })
    assert.equal(partial.outcome, WEBHOOK_OUTCOMES.IGNORED)
    await payment.refresh()
    assert.equal(payment.status, PAYMENT_STATUSES.PAID)
    assert.isNull(payment.revokedAt)
    assert.lengthOf(entitlements.revoked, 0)

    const total = await deliver({ amount: 4900, amount_refunded: 4900 })
    assert.equal(total.outcome, WEBHOOK_OUTCOMES.PROCESSED)
    await payment.refresh()
    assert.equal(payment.status, PAYMENT_STATUSES.REFUNDED)
    assert.deepEqual(entitlements.revoked, [payment.id])
  })

  test('checkout.session.completed incohérent (montant, devise, session) → unmatched, aucun déblocage', async ({
    assert,
  }) => {
    const { service, entitlements } = makeService()
    const payment = await pendingPayment('cs_test_match')
    const reported: ErrorContext[] = []
    const previous = setErrorReporter({ capture: (_error, context) => reported.push(context) })

    try {
      for (const override of [
        { amount_total: payment.amountCents - 100 },
        { currency: 'usd' },
        { id: 'cs_test_autre' },
      ]) {
        const result = await service.handle(
          JSON.stringify(
            event(STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED, {
              id: 'cs_test_match',
              client_reference_id: String(payment.id),
              payment_status: 'paid',
              amount_total: payment.amountCents,
              currency: payment.currency,
              ...override,
            })
          ),
          FAKE_STRIPE_SIGNATURE
        )
        assert.equal(result.outcome, WEBHOOK_OUTCOMES.UNMATCHED)
      }
    } finally {
      setErrorReporter(previous)
    }

    await payment.refresh()
    assert.equal(payment.status, PAYMENT_STATUSES.PENDING)
    assert.lengthOf(entitlements.unlocked, 0)
    assert.lengthOf(reported, 3)
  })

  test('code promo (#139) : completed remisé → paid, montant encaissé, remise, code et libellé relus', async ({
    assert,
  }) => {
    const { service, entitlements, stripe } = makeService()
    const payment = await pendingPayment('cs_test_promo')
    stripe.promotionCodes.set('promo_test_20', 'BIENVENUE20')

    const result = await service.handle(
      JSON.stringify(
        event(STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED, {
          id: 'cs_test_promo',
          client_reference_id: String(payment.id),
          payment_status: 'paid',
          payment_intent: 'pi_promo',
          amount_subtotal: payment.amountCents,
          amount_total: payment.amountCents - 980,
          currency: payment.currency,
          total_details: { amount_discount: 980, amount_shipping: 0, amount_tax: 0 },
          discounts: [{ coupon: 'co_x', promotion_code: 'promo_test_20' }],
        })
      ),
      FAKE_STRIPE_SIGNATURE
    )

    assert.equal(result.outcome, WEBHOOK_OUTCOMES.PROCESSED)
    await payment.refresh()
    assert.equal(payment.status, PAYMENT_STATUSES.PAID)
    assert.equal(payment.amountCents, 4900 - 980)
    assert.equal(payment.discountCents, 980)
    assert.equal(payment.promoCode, 'BIENVENUE20')
    assert.equal(payment.stripePromotionCodeId, 'promo_test_20')
    assert.deepEqual(entitlements.unlocked, [payment.id])
    assert.deepEqual(stripe.retrievedPromotionCodes, ['promo_test_20'])
  })

  test('code promo à 100 % (#139) : completed en no_payment_required, total 0, sans intent → paid, droit ouvert', async ({
    assert,
  }) => {
    const { service, entitlements, stripe } = makeService()
    const payment = await pendingPayment('cs_test_free')
    stripe.promotionCodes.set('promo_free', 'OFFERT100')

    const result = await service.handle(
      JSON.stringify(
        event(STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED, {
          id: 'cs_test_free',
          client_reference_id: String(payment.id),
          payment_status: 'no_payment_required',
          payment_intent: null,
          amount_subtotal: payment.amountCents,
          amount_total: 0,
          currency: payment.currency,
          total_details: {
            amount_discount: payment.amountCents,
            amount_shipping: 0,
            amount_tax: 0,
          },
          discounts: [
            { coupon: 'co_free', promotion_code: { id: 'promo_free', code: 'OFFERT100' } },
          ],
        })
      ),
      FAKE_STRIPE_SIGNATURE
    )

    assert.equal(result.outcome, WEBHOOK_OUTCOMES.PROCESSED)
    await payment.refresh()
    assert.equal(payment.status, PAYMENT_STATUSES.PAID)
    assert.equal(payment.amountCents, 0)
    assert.equal(payment.discountCents, 4900)
    assert.equal(payment.promoCode, 'OFFERT100')
    assert.isNull(payment.stripePaymentIntentId)
    assert.isTrue(payment.grantsAccess)
    assert.deepEqual(entitlements.unlocked, [payment.id])
  })

  test('code promo (#139) : payload allégé (sans total_details ni amount_total, discounts non tableau) → réglé au montant déduit, sans code', async ({
    assert,
  }) => {
    const { service, stripe } = makeService()
    const payment = await pendingPayment('cs_test_light')

    const result = await service.handle(
      JSON.stringify(
        event(STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED, {
          id: 'cs_test_light',
          client_reference_id: String(payment.id),
          payment_status: 'paid',
          payment_intent: 'pi_light',
          amount_subtotal: payment.amountCents,
          currency: payment.currency,
          discounts: 'not-an-array',
        })
      ),
      FAKE_STRIPE_SIGNATURE
    )

    assert.equal(result.outcome, WEBHOOK_OUTCOMES.PROCESSED)
    await payment.refresh()
    assert.equal(payment.status, PAYMENT_STATUSES.PAID)
    assert.equal(payment.amountCents, 4900)
    assert.equal(payment.discountCents, 0)
    assert.isNull(payment.promoCode)
    assert.isNull(payment.stripePromotionCodeId)
    assert.lengthOf(stripe.retrievedPromotionCodes, 0)
  })

  test('code promo (#139) : no_payment_required avec un total non nul ou sans remise → unmatched, rien n’est débloqué', async ({
    assert,
  }) => {
    const { service, entitlements } = makeService()
    const payment = await pendingPayment('cs_test_anomaly')
    const reported: ErrorContext[] = []
    const previous = setErrorReporter({ capture: (_error, context) => reported.push(context) })

    try {
      for (const override of [
        { amount_total: 10, total_details: { amount_discount: 4890 } },
        { amount_total: 0, total_details: { amount_discount: 0 } },
      ]) {
        const result = await service.handle(
          JSON.stringify(
            event(STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED, {
              id: 'cs_test_anomaly',
              client_reference_id: String(payment.id),
              payment_status: 'no_payment_required',
              payment_intent: null,
              amount_subtotal: payment.amountCents,
              currency: payment.currency,
              ...override,
            })
          ),
          FAKE_STRIPE_SIGNATURE
        )
        assert.equal(result.outcome, WEBHOOK_OUTCOMES.UNMATCHED)
      }
    } finally {
      setErrorReporter(previous)
    }
    await payment.refresh()
    assert.equal(payment.status, PAYMENT_STATUSES.PENDING)
    assert.lengthOf(entitlements.unlocked, 0)
    assert.lengthOf(reported, 2)
  })

  test('code promo (#139) : webhook rejoué après la réconciliation → processed, sans écart signalé', async ({
    assert,
  }) => {
    const { service, entitlements, payments } = makeService()
    const payment = await pendingPayment('cs_test_replay')
    // La page de succès a déjà réglé la ligne au montant remisé.
    await payments.markPaid(payment, {
      paymentIntentId: 'pi_replay',
      amountTotalCents: 3920,
      discountCents: 980,
      promotionCodeId: 'promo_test_20',
      promoCode: 'BIENVENUE20',
    })
    const reported: ErrorContext[] = []
    const previous = setErrorReporter({ capture: (_error, context) => reported.push(context) })

    try {
      const result = await service.handle(
        JSON.stringify(
          event(STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED, {
            id: 'cs_test_replay',
            client_reference_id: String(payment.id),
            payment_status: 'paid',
            payment_intent: 'pi_replay',
            amount_subtotal: 4900,
            amount_total: 3920,
            currency: 'eur',
            total_details: { amount_discount: 980 },
            discounts: [{ promotion_code: 'promo_test_20' }],
          })
        ),
        FAKE_STRIPE_SIGNATURE
      )
      assert.equal(result.outcome, WEBHOOK_OUTCOMES.PROCESSED)
    } finally {
      setErrorReporter(previous)
    }
    assert.lengthOf(reported, 0)
    await payment.refresh()
    assert.equal(payment.amountCents, 3920)
    assert.lengthOf(entitlements.unlocked, 1)
  })

  test('type non suivi → ignored ; paiement inconnu → unmatched ; les deux sont journalisés', async ({
    assert,
  }) => {
    const { service, entitlements } = makeService()

    const ignored = await service.handle(
      JSON.stringify(event('payment_intent.created', { id: 'pi_x' })),
      FAKE_STRIPE_SIGNATURE
    )
    const unmatched = await service.handle(
      JSON.stringify(
        event(STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED, {
          id: 'cs_unknown',
          client_reference_id: '999999',
          payment_status: 'paid',
        })
      ),
      FAKE_STRIPE_SIGNATURE
    )

    assert.equal(ignored.outcome, WEBHOOK_OUTCOMES.IGNORED)
    assert.equal(unmatched.outcome, WEBHOOK_OUTCOMES.UNMATCHED)
    assert.lengthOf(entitlements.unlocked, 0)
    const rows = await StripeEvent.all()
    assert.lengthOf(rows, 2)
    assert.isTrue(rows.every((row) => row.isProcessed))
  })

  test('traitement interrompu : la ligne reste ouverte, signalée, et la livraison suivante reprend', async ({
    assert,
  }) => {
    const entitlements = new SpyEntitlements(testNotifications())
    const payments = new PaymentsService(entitlements)
    let failOnce = true
    const originalMarkPaid = payments.markPaid.bind(payments)
    payments.markPaid = async (payment, details) => {
      if (failOnce) {
        failOnce = false
        throw new Error('base indisponible')
      }
      return originalMarkPaid(payment, details)
    }
    const stripe = new FakeStripeGateway()
    const service = new StripeWebhooksService(stripe, payments, new PromotionCodesService(stripe))
    const reported: ErrorContext[] = []
    const previous = setErrorReporter({ capture: (_error, context) => reported.push(context) })

    try {
      const payment = await pendingPayment()
      const evt = event(STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED, {
        id: 'cs_test_webhook',
        client_reference_id: String(payment.id),
        payment_status: 'paid',
      })

      await assert.rejects(() => service.handle(JSON.stringify(evt), FAKE_STRIPE_SIGNATURE))
      const [row] = await StripeEvent.all()
      assert.isFalse(row.isProcessed)
      assert.lengthOf(reported, 1)
      assert.deepEqual(reported[0].extra, { stripeEventId: evt.id })
      assert.equal(reported[0].tags?.feature, 'stripe_webhook')

      const retry = await service.handle(JSON.stringify(evt), FAKE_STRIPE_SIGNATURE)
      assert.equal(retry.outcome, WEBHOOK_OUTCOMES.PROCESSED)
      await payment.refresh()
      assert.equal(payment.status, PAYMENT_STATUSES.PAID)
      assert.lengthOf(await StripeEvent.all(), 1)
    } finally {
      setErrorReporter(previous)
    }
  })

  test('une ligne laissée ouverte par une livraison précédente est reprise (factory pending)', async ({
    assert,
  }) => {
    const { service } = makeService()
    const payment = await pendingPayment()
    const open = await StripeEventFactory.merge({ stripeEventId: 'evt_test_open' })
      .apply('pending')
      .create()

    const result = await service.handle(
      JSON.stringify(
        event(
          STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED,
          {
            id: 'cs_test_webhook',
            client_reference_id: String(payment.id),
            payment_status: 'paid',
          },
          open.stripeEventId
        )
      ),
      FAKE_STRIPE_SIGNATURE
    )

    assert.equal(result.outcome, WEBHOOK_OUTCOMES.PROCESSED)
    await open.refresh()
    assert.isTrue(open.isProcessed)
  })

  test('client_reference_id incohérent : non numérique → repli sur la session ; autre paiement → unmatched, rien n’est touché', async ({
    assert,
  }) => {
    const { service } = makeService()
    const target = await pendingPayment('cs_target')
    const other = await pendingPayment('cs_other')
    const run = (type: string, object: Record<string, unknown>) =>
      service.handle(JSON.stringify(fakeStripeEvent(type, object)), FAKE_STRIPE_SIGNATURE)

    const numeric = await run(STRIPE_WEBHOOK_EVENTS.CHECKOUT_EXPIRED, {
      id: 'cs_target',
      client_reference_id: 'abc',
    })
    assert.equal(numeric.paymentId, target.id)

    for (const type of [
      STRIPE_WEBHOOK_EVENTS.CHECKOUT_EXPIRED,
      STRIPE_WEBHOOK_EVENTS.ASYNC_PAYMENT_FAILED,
    ]) {
      const result = await run(type, { id: 'cs_unrelated', client_reference_id: String(other.id) })
      assert.equal(result.outcome, WEBHOOK_OUTCOMES.UNMATCHED)
    }
    await other.refresh()
    assert.equal(other.status, PAYMENT_STATUSES.PENDING)

    for (const reference of ['1.5', '-3', '0', '']) {
      const result = await run(STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED, {
        id: 'cs_none',
        client_reference_id: reference,
        payment_status: 'paid',
      })
      assert.equal(result.outcome, WEBHOOK_OUTCOMES.UNMATCHED)
    }
  })

  test('ordre inversé : expired après paid sans effet ; refund avant completed laisse le paiement ouvrir ensuite', async ({
    assert,
  }) => {
    const { service, entitlements } = makeService()
    const paid = await pendingPayment('cs_paid_first')
    const run = (type: string, object: Record<string, unknown>) =>
      service.handle(JSON.stringify(fakeStripeEvent(type, object)), FAKE_STRIPE_SIGNATURE)

    await run(STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED, {
      id: 'cs_paid_first',
      client_reference_id: String(paid.id),
      payment_status: 'paid',
      payment_intent: 'pi_order',
    })
    await run(STRIPE_WEBHOOK_EVENTS.CHECKOUT_EXPIRED, {
      id: 'cs_paid_first',
      client_reference_id: String(paid.id),
    })
    await paid.refresh()
    assert.equal(paid.status, PAYMENT_STATUSES.PAID)
    assert.isNull(paid.revokedAt)

    const late = await pendingPayment('cs_late')
    const refund = await run(STRIPE_WEBHOOK_EVENTS.CHARGE_REFUNDED, {
      payment_intent: 'pi_late',
      refunded: true,
    })
    assert.equal(refund.outcome, WEBHOOK_OUTCOMES.UNMATCHED)
    await run(STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED, {
      id: 'cs_late',
      client_reference_id: String(late.id),
      payment_status: 'paid',
      payment_intent: 'pi_late',
    })
    await late.refresh()
    assert.equal(late.status, PAYMENT_STATUSES.PAID)
    assert.includeMembers(entitlements.unlocked, [paid.id, late.id])
  })
})
