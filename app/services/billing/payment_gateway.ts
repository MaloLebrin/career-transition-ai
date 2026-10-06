import type {
  CheckoutSessionRef,
  CreateCheckoutSessionInput,
  PaymentGatewayWebhookEvent,
  RetrievedCheckoutSession,
  RetrievedPromotionCode,
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
  /** Libellé d'un code promotionnel (#139) ; `null` s'il n'existe pas chez le prestataire. */
  retrievePromotionCode(promotionCodeId: string): Promise<RetrievedPromotionCode | null>
  /** Vérifie la signature et désérialise l'événement ; `InvalidStripeSignatureError` sinon. */
  constructWebhookEvent(rawBody: string | Buffer, signature: string): PaymentGatewayWebhookEvent
}
