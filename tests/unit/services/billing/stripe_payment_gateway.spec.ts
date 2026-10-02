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
    assert.equal(params.success_url, INPUT.successUrl)
    assert.equal(params.cancel_url, INPUT.cancelUrl)
    // RGPD : jamais de nom dans ce qui part chez Stripe en dehors du compte client.
    assert.notInclude(JSON.stringify(params), 'Camille')
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
  test('createCheckoutSession refuse sans STRIPE_SECRET_KEY, sans appel réseau', async ({
    assert,
  }) => {
    const previous = stripeConfig.secretKey
    stripeConfig.secretKey = null
    try {
      await withEnv({ STRIPE_SECRET_KEY: undefined }, () =>
        assert.rejects(
          () => new StripePaymentGateway().createCheckoutSession(INPUT),
          PaymentGatewayNotConfiguredError
        )
      )
    } finally {
      stripeConfig.secretKey = previous
    }
  })
})
