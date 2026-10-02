import StripeEvent from '#models/stripe_event'
import { PaymentsService } from '#services/billing/payments_service'
import { StripePaymentGateway } from '#services/billing/stripe_payment_gateway'
import { reportError } from '#services/error_tracking_service'
import {
  STRIPE_WEBHOOK_EVENTS,
  WEBHOOK_OUTCOMES,
  type WebhookOutcome,
} from '#shared/constants/billing'
import type { PaymentGatewayWebhookEvent } from '#shared/types/billing/checkout'
import type { WebhookHandleResult } from '#shared/types/billing/webhooks'
import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'

/** Code SQLSTATE PostgreSQL d'une violation d'unicité. */
const UNIQUE_VIOLATION = '23505'

/**
 * Webhook Stripe (#104) : source de vérité des paiements, idempotente.
 *
 * 1. Signature vérifiée par la passerelle (`InvalidStripeSignatureError` → 400).
 * 2. L'événement est inscrit dans `stripe_events` ; déjà traité → aucun effet.
 * 3. Routage par type : paiement `paid` / `failed` / `canceled` / `refunded`,
 *    chaque transition étant elle-même idempotente (`PaymentsService`).
 * 4. `processed_at` posé à la fin : une erreur laisse la ligne « ouverte » et
 *    la prochaine livraison de Stripe (retry) reprend le traitement.
 *
 * Aucune donnée personnelle n'est journalisée : ids Stripe et ids locaux seulement.
 */
@inject()
export class StripeWebhooksService {
  constructor(
    private gateway: StripePaymentGateway,
    private payments: PaymentsService
  ) {}

  public async handle(rawBody: string | Buffer, signature: string): Promise<WebhookHandleResult> {
    const event = this.gateway.constructWebhookEvent(rawBody, signature)
    const record = await this.claim(event)
    if (!record) {
      logger.info('Webhook Stripe : événement déjà traité, ignoré', {
        stripeEventId: event.id,
        type: event.type,
      })
      return {
        eventId: event.id,
        type: event.type,
        outcome: WEBHOOK_OUTCOMES.DUPLICATE,
        paymentId: null,
      }
    }

    try {
      const { outcome, paymentId } = await this.process(event)
      record.processedAt = DateTime.now()
      await record.save()
      logger.info('Webhook Stripe : événement traité', {
        stripeEventId: event.id,
        type: event.type,
        outcome,
        paymentId,
      })
      return { eventId: event.id, type: event.type, outcome, paymentId }
    } catch (error) {
      reportError(error, {
        tags: { feature: 'stripe_webhook', eventType: event.type },
        extra: { stripeEventId: event.id },
      })
      throw error
    }
  }

  /**
   * Réserve l'événement : `null` s'il a déjà été traité. Une ligne laissée
   * sans `processed_at` (traitement interrompu) est reprise.
   */
  private async claim(event: PaymentGatewayWebhookEvent): Promise<StripeEvent | null> {
    const existing = await StripeEvent.findBy('stripeEventId', event.id)
    if (existing) return existing.isProcessed ? null : existing

    try {
      return await StripeEvent.create({
        stripeEventId: event.id,
        type: event.type,
        livemode: event.livemode,
        processedAt: null,
      })
    } catch (error) {
      // Deux livraisons simultanées : la seconde perd la course et s'efface.
      if ((error as { code?: string }).code === UNIQUE_VIOLATION) return null
      throw error
    }
  }

  private async process(
    event: PaymentGatewayWebhookEvent
  ): Promise<{ outcome: WebhookOutcome; paymentId: number | null }> {
    const object = event.data.object

    switch (event.type) {
      case STRIPE_WEBHOOK_EVENTS.CHECKOUT_COMPLETED:
      case STRIPE_WEBHOOK_EVENTS.ASYNC_PAYMENT_SUCCEEDED: {
        const payment = await this.findCheckoutPayment(object)
        if (!payment) return this.unmatched(event)
        // `completed` arrive aussi pour un paiement différé encore `unpaid` : on attend `async_payment_succeeded`.
        if (object.payment_status !== 'paid') {
          return { outcome: WEBHOOK_OUTCOMES.PROCESSED, paymentId: payment.id }
        }
        const consistent = this.payments.sessionMatches(payment, {
          sessionId: stringOrNull(object.id),
          amountTotal: typeof object.amount_total === 'number' ? object.amount_total : null,
          currency: stringOrNull(object.currency),
        })
        if (!consistent) return this.unmatched(event)
        await this.payments.markPaid(payment, {
          paymentIntentId: stringOrNull(object.payment_intent),
        })
        return { outcome: WEBHOOK_OUTCOMES.PROCESSED, paymentId: payment.id }
      }
      case STRIPE_WEBHOOK_EVENTS.ASYNC_PAYMENT_FAILED: {
        const payment = await this.findCheckoutPayment(object)
        if (!payment) return this.unmatched(event)
        await this.payments.markFailed(payment)
        return { outcome: WEBHOOK_OUTCOMES.PROCESSED, paymentId: payment.id }
      }
      case STRIPE_WEBHOOK_EVENTS.CHECKOUT_EXPIRED: {
        const payment = await this.findCheckoutPayment(object)
        if (!payment) return this.unmatched(event)
        await this.payments.markCanceled(payment)
        return { outcome: WEBHOOK_OUTCOMES.PROCESSED, paymentId: payment.id }
      }
      case STRIPE_WEBHOOK_EVENTS.CHARGE_REFUNDED: {
        const intentId = stringOrNull(object.payment_intent)
        const payment = intentId ? await this.payments.findByPaymentIntent(intentId) : null
        if (!payment) return this.unmatched(event)
        // Remboursement partiel : le droit reste ouvert, on ne révoque pas.
        if (!isFullRefund(object)) {
          return { outcome: WEBHOOK_OUTCOMES.IGNORED, paymentId: payment.id }
        }
        await this.payments.refund(payment)
        return { outcome: WEBHOOK_OUTCOMES.PROCESSED, paymentId: payment.id }
      }
      default:
        return { outcome: WEBHOOK_OUTCOMES.IGNORED, paymentId: null }
    }
  }

  /** Session Checkout : `client_reference_id` (id du paiement) d'abord, puis l'id de session. */
  private async findCheckoutPayment(session: Record<string, unknown>) {
    const reference = stringOrNull(session.client_reference_id)
    if (reference) {
      const byId = await this.payments.findById(Number(reference))
      if (byId) return byId
    }
    const sessionId = stringOrNull(session.id)
    return sessionId ? this.payments.findByCheckoutSession(sessionId) : null
  }

  private unmatched(event: PaymentGatewayWebhookEvent) {
    logger.warn('Webhook Stripe : aucun paiement local pour cet événement', {
      stripeEventId: event.id,
      type: event.type,
    })
    return { outcome: WEBHOOK_OUTCOMES.UNMATCHED, paymentId: null }
  }
}

/** `charge.refunded` est aussi émis pour un remboursement partiel : seul le total retire le droit. */
function isFullRefund(charge: Record<string, unknown>): boolean {
  if (charge.refunded === true) return true
  const { amount, amount_refunded: refunded } = charge
  return (
    typeof amount === 'number' && typeof refunded === 'number' && amount > 0 && refunded >= amount
  )
}

/** Stripe renvoie tantôt un id, tantôt l'objet développé (`{ id }`). */
function stringOrNull(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) return value
  if (value && typeof value === 'object' && typeof (value as { id?: unknown }).id === 'string') {
    return (value as { id: string }).id
  }
  return null
}
