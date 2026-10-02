import { InvalidStripeSignatureError } from '#exceptions/billing_errors'
import { StripePaymentGateway } from '#services/billing/stripe_payment_gateway'
import type {
  CheckoutSessionRef,
  CreateCheckoutSessionInput,
  PaymentGatewayWebhookEvent,
  RetrievedCheckoutSession,
} from '#shared/types/billing/checkout'
import app from '@adonisjs/core/services/app'

/** Signature acceptée par la passerelle factice (`constructWebhookEvent`). */
export const FAKE_STRIPE_SIGNATURE = 'fake-stripe-signature'

/**
 * Remplace `StripePaymentGateway` par une passerelle en mémoire (pattern
 * `swapFakeCloudinary`). Aucun appel réseau : les sessions créées sont gardées
 * par id, `pay(sessionId)` simule le paiement côté Stripe, et chaque appel est
 * journalisé pour les assertions.
 *
 * ```ts
 * let stripe: FakeStripeGateway
 * group.each.setup(() => {
 *   stripe = swapFakeStripe()
 *   return () => restoreStripe()
 * })
 * ```
 */
export class FakeStripeGateway extends StripePaymentGateway {
  readonly sessions = new Map<
    string,
    {
      input: CreateCheckoutSessionInput
      paymentStatus: 'paid' | 'unpaid'
      paymentIntentId: string | null
      status: 'open' | 'complete' | 'expired'
      /** Écarts simulés côté Stripe pour les tests de recoupement. */
      amountTotal: number
      currency: string
    }
  >()
  readonly created: CreateCheckoutSessionInput[] = []
  readonly retrieved: string[] = []
  private counter = 0

  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSessionRef> {
    if (this.failNextCreate) {
      this.failNextCreate = false
      throw new Error('FakeStripeGateway : panne simulée')
    }
    this.counter += 1
    const id = `cs_test_fake_${this.counter}`
    this.sessions.set(id, {
      input,
      paymentStatus: 'unpaid',
      paymentIntentId: null,
      status: 'open',
      amountTotal: input.amountCents,
      currency: input.currency,
    })
    this.created.push(input)
    return { id, url: `https://checkout.stripe.test/pay/${id}` }
  }

  async retrieveCheckoutSession(sessionId: string): Promise<RetrievedCheckoutSession | null> {
    this.retrieved.push(sessionId)
    const session = this.sessions.get(sessionId)
    if (!session) return null
    return {
      id: sessionId,
      paymentStatus: session.paymentStatus,
      paymentIntentId: session.paymentIntentId,
      status: session.paymentStatus === 'paid' ? 'complete' : session.status,
      url: `https://checkout.stripe.test/pay/${sessionId}`,
      amountTotal: session.amountTotal,
      currency: session.currency,
    }
  }

  constructWebhookEvent(rawBody: string | Buffer, signature: string): PaymentGatewayWebhookEvent {
    if (signature !== FAKE_STRIPE_SIGNATURE) throw new InvalidStripeSignatureError()
    return JSON.parse(String(rawBody)) as PaymentGatewayWebhookEvent
  }

  /** Simule le paiement de la session côté Stripe. */
  pay(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`FakeStripeGateway : session inconnue ${sessionId}`)
    session.paymentStatus = 'paid'
    session.paymentIntentId = `pi_test_fake_${sessionId.split('_').pop()}`
  }

  /** Simule l'expiration de la session côté Stripe (24 h sans paiement). */
  expire(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`FakeStripeGateway : session inconnue ${sessionId}`)
    session.status = 'expired'
  }

  /** Les appels suivants à `createCheckoutSession` échouent (panne Stripe). */
  failNextCreate = false

  lastSessionId(): string | null {
    const ids = [...this.sessions.keys()]
    return ids.length > 0 ? ids[ids.length - 1] : null
  }
}

export function swapFakeStripe(): FakeStripeGateway {
  const fake = new FakeStripeGateway()
  app.container.swap(StripePaymentGateway, () => fake)
  return fake
}

export function restoreStripe(): void {
  app.container.restore(StripePaymentGateway)
}
