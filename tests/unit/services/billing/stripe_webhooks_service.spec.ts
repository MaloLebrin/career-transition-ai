import { testNotifications } from '#tests/support/entitlements'
import { CandidatePaymentFactory } from '#database/factories/candidate_payment_factory'
import { StripeEventFactory } from '#database/factories/stripe_event_factory'
import { InvalidStripeSignatureError } from '#exceptions/billing_errors'
import type CandidatePayment from '#models/candidate_payment'
import type Employee from '#models/employee'
import StripeEvent from '#models/stripe_event'
import { PaymentsService } from '#services/billing/payments_service'
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
import { FAKE_STRIPE_SIGNATURE, FakeStripeGateway } from '#tests/support/fake_stripe'
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
  const service = new StripeWebhooksService(new FakeStripeGateway(), payments)
  return { entitlements, payments, service }
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
    const service = new StripeWebhooksService(new FakeStripeGateway(), payments)
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
})
