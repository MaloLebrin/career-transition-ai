import stripeConfig from '#config/stripe'
import {
  InvalidStripeSignatureError,
  PaymentGatewayNotConfiguredError,
} from '#exceptions/billing_errors'
import type { PaymentGateway } from '#services/billing/payment_gateway'
import type {
  CheckoutSessionRef,
  CreateCheckoutSessionInput,
  PaymentGatewayWebhookEvent,
  RetrievedCheckoutSession,
} from '#shared/types/billing/checkout'
import Stripe from 'stripe'

/**
 * Stripe Checkout hébergé, `mode: payment`, one-shot (#102). Aucun Stripe.js
 * dans le bundle : le navigateur est redirigé vers l'URL de la session, puis
 * revient sur `success_url` ; la confirmation vient de la réconciliation
 * (`CheckoutService.reconcile`) et du webhook (#104).
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
      return {
        id: session.id,
        paymentStatus: session.payment_status as RetrievedCheckoutSession['paymentStatus'],
        paymentIntentId:
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : (session.payment_intent?.id ?? null),
        status: session.status as RetrievedCheckoutSession['status'],
        url: session.url ?? null,
        amountTotal: session.amount_total ?? null,
        currency: session.currency ?? null,
      }
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
