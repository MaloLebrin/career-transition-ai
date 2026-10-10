import {
  InvalidStripeSignatureError,
  PaymentGatewayNotConfiguredError,
} from '#exceptions/billing_errors'
import { StripePaymentGateway } from '#services/billing/stripe_payment_gateway'
import type { CreateCheckoutSessionInput } from '#shared/types/billing/checkout'
import { withEnv } from '#tests/utils/env'
import stripeConfig from '#config/stripe'
import { test } from '@japa/runner'
import Stripe from 'stripe'

/** Aucun appel réseau : paramètres purs et utilitaires de signature du SDK. */
const INPUT: CreateCheckoutSessionInput = {
  paymentId: 42,
  employeeId: 7,
  amountCents: 4900,
  currency: 'eur',
  productName: 'Forfait',
  customerEmail: 'camille@example.com',
  successUrl:
    'https://app.example.test/dashboard/candidat/billing/success?session_id={CHECKOUT_SESSION_ID}',
  cancelUrl: 'https://app.example.test/dashboard/candidat/billing/cancel',
}

const EVENT = {
  id: 'evt_test_1',
  object: 'event',
  type: 'checkout.session.completed',
  livemode: false,
  data: { object: { id: 'cs_test_1', payment_status: 'paid' } },
}

/** `stripeConfig` est lu au boot : on le surcharge le temps du test. */
function withWebhookSecret<T>(secret: string | null, run: () => T): T {
  const previous = stripeConfig.webhookSecret
  stripeConfig.webhookSecret = secret
  try {
    return run()
  } finally {
    stripeConfig.webhookSecret = previous
  }
}

test.group('StripePaymentGateway.checkoutParams', () => {
  test('session one-shot en français, ids seulement dans metadata, facture activée', ({
    assert,
  }) => {
    const params = StripePaymentGateway.checkoutParams(INPUT)

    assert.equal(params.mode, 'payment')
    assert.equal(params.locale, 'fr')
    assert.equal(params.customer_email, 'camille@example.com')
    assert.equal(params.client_reference_id, '42')
    assert.deepEqual(params.metadata, { paymentId: '42', employeeId: '7' })
    assert.deepEqual(params.line_items, [
      {
        quantity: 1,
        price_data: { currency: 'eur', unit_amount: 4900, product_data: { name: 'Forfait' } },
      },
    ])
    assert.deepEqual(params.invoice_creation, { enabled: true })
    // Codes promo gérés dans Stripe (#139) : champ de saisie sur la page hébergée.
    assert.isTrue(params.allow_promotion_codes)
    assert.equal(params.success_url, INPUT.successUrl)
    assert.equal(params.cancel_url, INPUT.cancelUrl)
    // RGPD : jamais de nom dans ce qui part chez Stripe en dehors du compte client.
    assert.notInclude(JSON.stringify(params), 'Camille')
  })
})

/** Session Stripe minimale telle que `checkout.sessions.retrieve` la renvoie. */
function stripeSession(overrides: Record<string, unknown>): Stripe.Checkout.Session {
  return {
    id: 'cs_test_view',
    object: 'checkout.session',
    payment_status: 'paid',
    payment_intent: 'pi_test_view',
    status: 'complete',
    url: null,
    amount_total: 4900,
    amount_subtotal: 4900,
    currency: 'eur',
    total_details: { amount_discount: 0, amount_shipping: 0, amount_tax: 0 },
    discounts: [],
    ...overrides,
  } as unknown as Stripe.Checkout.Session
}

test.group('StripePaymentGateway.sessionView (#139)', () => {
  test('sans code promo : remise 0, aucun code', ({ assert }) => {
    const view = StripePaymentGateway.sessionView(stripeSession({}))

    assert.deepEqual(view, {
      id: 'cs_test_view',
      paymentStatus: 'paid',
      paymentIntentId: 'pi_test_view',
      status: 'complete',
      url: null,
      amountTotal: 4900,
      amountSubtotal: 4900,
      currency: 'eur',
      discountCents: 0,
      promotionCodeId: null,
    })
  })

  test('code promo : remise et id du code lus, intent développé ou non', ({ assert }) => {
    const view = StripePaymentGateway.sessionView(
      stripeSession({
        amount_total: 3920,
        total_details: { amount_discount: 980, amount_shipping: 0, amount_tax: 0 },
        discounts: [{ coupon: 'co_x', promotion_code: 'promo_test_20' }],
        payment_intent: { id: 'pi_expanded' },
      })
    )

    assert.equal(view.amountTotal, 3920)
    assert.equal(view.amountSubtotal, 4900)
    assert.equal(view.discountCents, 980)
    assert.equal(view.promotionCodeId, 'promo_test_20')
    assert.equal(view.paymentIntentId, 'pi_expanded')
  })

  test('code à 100 % : no_payment_required, total 0, sans PaymentIntent ; objet promotion développé', ({
    assert,
  }) => {
    const view = StripePaymentGateway.sessionView(
      stripeSession({
        payment_status: 'no_payment_required',
        payment_intent: null,
        amount_total: 0,
        total_details: null,
        discounts: [{ coupon: 'co_free', promotion_code: { id: 'promo_free', code: 'OFFERT100' } }],
      })
    )

    assert.equal(view.paymentStatus, 'no_payment_required')
    assert.isNull(view.paymentIntentId)
    assert.equal(view.amountTotal, 0)
    // `total_details` absent : la remise est déduite du sous-total.
    assert.equal(view.discountCents, 4900)
    assert.equal(view.promotionCodeId, 'promo_free')
  })
})

test.group('StripePaymentGateway.constructWebhookEvent', () => {
  test('accepte une signature valide et réduit l’événement', ({ assert }) => {
    const payload = JSON.stringify(EVENT)
    const header = new Stripe('sk_test_x').webhooks.generateTestHeaderString({
      payload,
      secret: 'whsec_test',
    })

    const event = withWebhookSecret('whsec_test', () =>
      new StripePaymentGateway().constructWebhookEvent(payload, header)
    )

    assert.equal(event.id, 'evt_test_1')
    assert.equal(event.type, 'checkout.session.completed')
    assert.isFalse(event.livemode)
    assert.equal((event.data.object as { id: string }).id, 'cs_test_1')
  })

  test('refuse une signature pour un autre secret ou un corps modifié', ({ assert }) => {
    const payload = JSON.stringify(EVENT)
    const header = new Stripe('sk_test_x').webhooks.generateTestHeaderString({
      payload,
      secret: 'whsec_other',
    })

    withWebhookSecret('whsec_test', () => {
      assert.throws(
        () => new StripePaymentGateway().constructWebhookEvent(payload, header),
        InvalidStripeSignatureError
      )
      assert.throws(
        () => new StripePaymentGateway().constructWebhookEvent(`${payload} `, 'garbage'),
        InvalidStripeSignatureError
      )
    })
  })

  test('sans STRIPE_WEBHOOK_SECRET : passerelle non configurée', ({ assert }) => {
    withWebhookSecret(null, () => {
      assert.throws(
        () => new StripePaymentGateway().constructWebhookEvent('{}', 'sig'),
        PaymentGatewayNotConfiguredError
      )
    })
  })
})

test.group('StripePaymentGateway — clé absente', () => {
  test('createCheckoutSession et retrievePromotionCode refusent sans STRIPE_SECRET_KEY, sans appel réseau', async ({
    assert,
  }) => {
    const previous = stripeConfig.secretKey
    stripeConfig.secretKey = null
    try {
      await withEnv({ STRIPE_SECRET_KEY: undefined }, async () => {
        await assert.rejects(
          () => new StripePaymentGateway().createCheckoutSession(INPUT),
          PaymentGatewayNotConfiguredError
        )
        await assert.rejects(
          () => new StripePaymentGateway().retrievePromotionCode('promo_x'),
          PaymentGatewayNotConfiguredError
        )
      })
    } finally {
      stripeConfig.secretKey = previous
    }
  })
})
