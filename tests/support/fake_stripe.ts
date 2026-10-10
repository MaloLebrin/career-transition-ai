import { InvalidStripeSignatureError } from '#exceptions/billing_errors'
import { StripePaymentGateway } from '#services/billing/stripe_payment_gateway'
import type { CheckoutPaymentStatus } from '#shared/constants/billing'
import { CHECKOUT_PAYMENT_STATUSES } from '#shared/constants/billing'
import { isCheckoutSettled } from '#shared/helpers/billing/checkout_session'
import type {
  CheckoutSessionRef,
  CreateCheckoutSessionInput,
  PaymentGatewayWebhookEvent,
  RetrievedCheckoutSession,
  RetrievedPromotionCode,
} from '#shared/types/billing/checkout'
import app from '@adonisjs/core/services/app'

/** Signature acceptée par la passerelle factice (`constructWebhookEvent`). */
export const FAKE_STRIPE_SIGNATURE = 'fake-stripe-signature'

/** Événement webhook Stripe minimal, prêt à être sérialisé vers `constructWebhookEvent`. */
export function fakeStripeEvent(
  type: string,
  object: Record<string, unknown>,
  id = `evt_fake_${Math.random().toString(36).slice(2, 10)}`
): PaymentGatewayWebhookEvent {
  return { id, type, livemode: false, data: { object } }
}

/**
 * Remplace `StripePaymentGateway` par une passerelle en mémoire (pattern
 * `swapFakeCloudinary`). Aucun appel réseau : les sessions créées sont gardées
 * par id, `pay(sessionId)` simule le paiement côté Stripe (avec une remise de
 * code promo en option, #139 ; une remise égale au prix donne
 * `no_payment_required` sans PaymentIntent), et chaque appel est journalisé
 * pour les assertions. `promotionCodes` (id → libellé) alimente
 * `retrievePromotionCode`.
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
      paymentStatus: CheckoutPaymentStatus
      paymentIntentId: string | null
      status: 'open' | 'complete' | 'expired'
      /** Écarts simulés côté Stripe pour les tests de recoupement. */
      amountTotal: number
      amountSubtotal: number
      currency: string
      /** Code promo appliqué au paiement (#139). */
      discountCents: number
      promotionCodeId: string | null
    }
  >()
  readonly created: CreateCheckoutSessionInput[] = []
  readonly retrieved: string[] = []
  /** Codes promotionnels connus côté Stripe : id `promo_…` → libellé (#139). */
  readonly promotionCodes = new Map<string, string>()
  readonly retrievedPromotionCodes: string[] = []
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
      paymentStatus: CHECKOUT_PAYMENT_STATUSES.UNPAID,
      paymentIntentId: null,
      status: 'open',
      amountTotal: input.amountCents,
      amountSubtotal: input.amountCents,
      currency: input.currency,
      discountCents: 0,
      promotionCodeId: null,
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
      status: isCheckoutSettled(session.paymentStatus) ? 'complete' : session.status,
      url: `https://checkout.stripe.test/pay/${sessionId}`,
      amountTotal: session.amountTotal,
      amountSubtotal: session.amountSubtotal,
      currency: session.currency,
      discountCents: session.discountCents,
      promotionCodeId: session.promotionCodeId,
    }
  }

  async retrievePromotionCode(promotionCodeId: string): Promise<RetrievedPromotionCode | null> {
    this.retrievedPromotionCodes.push(promotionCodeId)
    if (this.failNextPromotionCodeRetrieve) {
      this.failNextPromotionCodeRetrieve = false
      throw new Error('FakeStripeGateway : panne simulée (promotion code)')
    }
    const code = this.promotionCodes.get(promotionCodeId)
    return code ? { id: promotionCodeId, code } : null
  }

  constructWebhookEvent(rawBody: string | Buffer, signature: string): PaymentGatewayWebhookEvent {
    if (signature !== FAKE_STRIPE_SIGNATURE) throw new InvalidStripeSignatureError()
    return JSON.parse(String(rawBody)) as PaymentGatewayWebhookEvent
  }

  /**
   * Simule le paiement de la session côté Stripe. Avec un code promo (#139),
   * la remise est retirée du total ; une remise égale au prix donne une session
   * `no_payment_required` sans PaymentIntent (code à 100 %).
   */
  pay(
    sessionId: string,
    promo: { discountCents?: number; promotionCodeId?: string | null } = {}
  ): void {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`FakeStripeGateway : session inconnue ${sessionId}`)
    const discount = Math.min(promo.discountCents ?? 0, session.amountSubtotal)
    session.discountCents = discount
    session.promotionCodeId = promo.promotionCodeId ?? null
    session.amountTotal = session.amountSubtotal - discount
    if (session.amountTotal === 0 && discount > 0) {
      session.paymentStatus = CHECKOUT_PAYMENT_STATUSES.NO_PAYMENT_REQUIRED
      session.paymentIntentId = null
      return
    }
    session.paymentStatus = CHECKOUT_PAYMENT_STATUSES.PAID
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

  /** Le prochain `retrievePromotionCode` échoue (panne Stripe au moment de relire le libellé). */
  failNextPromotionCodeRetrieve = false

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
