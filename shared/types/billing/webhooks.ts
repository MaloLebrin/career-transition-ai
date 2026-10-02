import type { WebhookOutcome } from '#shared/constants/billing'

/** Résultat de `StripeWebhooksService.handle` (#104), journalisé, jamais renvoyé à Stripe. */
export interface WebhookHandleResult {
  eventId: string
  type: string
  outcome: WebhookOutcome
  /** Paiement local concerné, si retrouvé. */
  paymentId: number | null
}
