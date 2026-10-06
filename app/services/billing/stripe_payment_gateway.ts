import stripeConfig from '#config/stripe'
import {
  InvalidStripeSignatureError,
  PaymentGatewayNotConfiguredError,
} from '#exceptions/billing_errors'
import type { PaymentGateway } from '#services/billing/payment_gateway'
import { checkoutDiscountCents } from '#shared/helpers/billing/checkout_session'
import type {
  CheckoutSessionRef,
  CreateCheckoutSessionInput,
  PaymentGatewayWebhookEvent,
  RetrievedCheckoutSession,
  RetrievedPromotionCode,
} from '#shared/types/billing/checkout'
import Stripe from 'stripe'

/**
 * Stripe Checkout hébergé, `mode: payment`, one-shot (#102). Aucun Stripe.js
 * dans le bundle : le navigateur est redirigé vers l'URL de la session, puis
 * revient sur `success_url` ; la confirmation vient de la réconciliation
 * (`CheckoutService.reconcile`) et du webhook (#104). Les codes promo (#139)
 * sont créés dans le tableau de bord Stripe et saisis sur la page hébergée
 * (`allow_promotion_codes`) : l'application ne fait que relire la remise.
 *
 * Résolue via le conteneur (`@inject()`), pour que `swapFakeStripe()` la
 * remplace en test.
 */
export class StripePaymentGateway implements PaymentGateway {
  private client: Stripe | null = null

  /** Paramètres de session, purs : ids seulement dans `metadata`, jamais de nom. */
  static checkoutParams(input: CreateCheckoutSessionInput): Stripe.Checkout.SessionCreateParams {
    return {
      mode: 'payment',
      locale: 'fr',
      // Codes promo gérés dans Stripe (#139) : champ de saisie sur la page hébergée.
      allow_promotion_codes: true,
      customer_email: input.customerEmail,
      client_reference_id: String(input.paymentId),
      metadata: { paymentId: String(input.paymentId), employeeId: String(input.employeeId) },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency,
            unit_amount: input.amountCents,
            product_data: { name: input.productName },
          },
        },
      ],
      invoice_creation: { enabled: true },
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    }
  }

  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSessionRef> {
    const session = await this.stripe().checkout.sessions.create(
      StripePaymentGateway.checkoutParams(input)
    )
    if (!session.url) {
      throw new Error('Stripe : session Checkout créée sans URL de paiement.')
    }
    return { id: session.id, url: session.url }
  }

  async retrieveCheckoutSession(sessionId: string): Promise<RetrievedCheckoutSession | null> {
    try {
      const session = await this.stripe().checkout.sessions.retrieve(sessionId)
      return StripePaymentGateway.sessionView(session)
    } catch (error) {
      if ((error as Stripe.errors.StripeError).code === 'resource_missing') return null
      throw error
    }
  }

  /** Lecture pure d'une session Stripe, réduite à ce que le domaine utilise (#102, #139). */
  static sessionView(session: Stripe.Checkout.Session): RetrievedCheckoutSession {
    const amountTotal = session.amount_total ?? null
    const amountSubtotal = session.amount_subtotal ?? null
    return {
      id: session.id,
      paymentStatus: session.payment_status as RetrievedCheckoutSession['paymentStatus'],
      paymentIntentId: idOf(session.payment_intent),
      status: session.status as RetrievedCheckoutSession['status'],
      url: session.url ?? null,
      amountTotal,
      amountSubtotal,
      currency: session.currency ?? null,
      discountCents: checkoutDiscountCents({
        amountSubtotal,
        amountTotal,
        amountDiscount: session.total_details?.amount_discount ?? null,
      }),
      promotionCodeId: idOf(session.discounts?.[0]?.promotion_code),
    }
  }

  async retrievePromotionCode(promotionCodeId: string): Promise<RetrievedPromotionCode | null> {
    try {
      const promotion = await this.stripe().promotionCodes.retrieve(promotionCodeId)
      return { id: promotion.id, code: promotion.code }
    } catch (error) {
      if ((error as Stripe.errors.StripeError).code === 'resource_missing') return null
      throw error
    }
  }

  constructWebhookEvent(rawBody: string | Buffer, signature: string): PaymentGatewayWebhookEvent {
    if (!stripeConfig.webhookSecret) {
      throw new PaymentGatewayNotConfiguredError()
    }
    try {
      const event = this.webhooks().constructEvent(rawBody, signature, stripeConfig.webhookSecret)
      return {
        id: event.id,
        type: event.type,
        livemode: event.livemode,
        data: { object: event.data.object as unknown as Record<string, unknown> },
      }
    } catch (error) {
      if (error instanceof PaymentGatewayNotConfiguredError) throw error
      throw new InvalidStripeSignatureError()
    }
  }

  private stripe(): Stripe {
    if (!stripeConfig.secretKey) {
      throw new PaymentGatewayNotConfiguredError()
    }
    this.client ??= new Stripe(stripeConfig.secretKey)
    return this.client
  }

  /** L'utilitaire de signature ne fait aucun appel réseau et n'a pas besoin d'une clé valide. */
  private webhooks(): Stripe['webhooks'] {
    return (this.client ?? new Stripe(stripeConfig.secretKey ?? 'sk_test_signature_only')).webhooks
  }
}

/** Stripe renvoie tantôt un id, tantôt l'objet développé (`{ id }`). */
function idOf(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) return value
  if (value && typeof value === 'object' && typeof (value as { id?: unknown }).id === 'string') {
    return (value as { id: string }).id
  }
  return null
}
