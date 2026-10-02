import type {
  CheckoutSessionRef,
  CreateCheckoutSessionInput,
  PaymentGatewayWebhookEvent,
  RetrievedCheckoutSession,
} from '#shared/types/billing/checkout'

/**
 * Passerelle de paiement (#102). Une seule implémentation réelle
 * (`StripePaymentGateway`) ; les tests la remplacent par
 * `FakeStripeGateway` (`#tests/support/fake_stripe`), sans réseau.
 */
export interface PaymentGateway {
  createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSessionRef>
  /** `null` si la session n'existe pas chez le prestataire. */
  retrieveCheckoutSession(sessionId: string): Promise<RetrievedCheckoutSession | null>
  /** Vérifie la signature et désérialise l'événement ; `InvalidStripeSignatureError` sinon. */
  constructWebhookEvent(rawBody: string | Buffer, signature: string): PaymentGatewayWebhookEvent
}
