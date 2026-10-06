import type { CheckoutPaymentStatus } from '#shared/constants/billing'

/**
 * Passerelle de paiement (#102) : ce que le domaine demande à Stripe, sans
 * dépendre de son SDK — la passerelle factice des tests implémente la même
 * interface.
 */

export interface CreateCheckoutSessionInput {
  /** `candidate_payments.id`, transmis en `client_reference_id` et `metadata.paymentId`. */
  paymentId: number
  /** Id de la fiche candidat, en `metadata.employeeId` — jamais de nom. */
  employeeId: number
  amountCents: number
  /** Code ISO 4217 en minuscules. */
  currency: string
  productName: string
  customerEmail: string
  /** Contient le gabarit `{CHECKOUT_SESSION_ID}`, remplacé par Stripe. */
  successUrl: string
  cancelUrl: string
}

export interface CheckoutSessionRef {
  id: string
  /** Page de paiement hébergée par Stripe. */
  url: string
}

export type { CheckoutPaymentStatus }

export interface RetrievedCheckoutSession {
  id: string
  paymentStatus: CheckoutPaymentStatus
  /** `null` quand aucun paiement n'a été nécessaire (code promo à 100 %, #139). */
  paymentIntentId: string | null
  status: 'open' | 'complete' | 'expired' | null
  /** Page de paiement, encore valable tant que la session est `open`. */
  url: string | null
  /** Montant encaissé après remise, en centimes (`amount_total`). */
  amountTotal: number | null
  /** Prix catalogue avant remise, en centimes (`amount_subtotal`). */
  amountSubtotal: number | null
  /** Devise ISO 4217 en minuscules. */
  currency: string | null
  /** Remise appliquée par un code promo (`total_details.amount_discount`), 0 sans code. */
  discountCents: number
  /** Id Stripe du code promotionnel utilisé (`discounts[].promotion_code`, `promo_…`), `null` sans code. */
  promotionCodeId: string | null
}

/** Code promotionnel Stripe relu pour afficher son libellé (#139). */
export interface RetrievedPromotionCode {
  id: string
  /** Libellé saisi par le candidat sur la page Stripe (« BIENVENUE20 »). */
  code: string
}

/**
 * Ce que Stripe a réellement réglé, écrit sur la ligne locale par
 * `PaymentsService.markPaid` (#139). Les champs optionnels absents laissent la
 * ligne telle quelle (prix catalogue, sans remise).
 */
export interface PaymentSettlement {
  paymentIntentId: string | null
  /** `amount_total` : montant encaissé après remise ; `null` ou absent = non transmis. */
  amountTotalCents?: number | null
  discountCents?: number
  promotionCodeId?: string | null
  /** Libellé du code, résolu au mieux (`PromotionCodesService.labelFor`). */
  promoCode?: string | null
}

/** Événement webhook vérifié (#104), réduit à ce que le domaine lit. */
export interface PaymentGatewayWebhookEvent {
  id: string
  type: string
  livemode: boolean
  data: { object: Record<string, unknown> }
}

export interface CheckoutStartResult {
  paymentId: number
  /** URL externe vers laquelle rediriger le navigateur. */
  url: string
}

export interface CheckoutReconcileResult {
  paymentId: number
  paid: boolean
}

/** Page de l'offre (`GET /dashboard/candidat/offre`). */
export interface OfferView {
  hasPaidAccess: boolean
  emailVerified: boolean
  paymentsEnabled: boolean
  priceCents: number
  currency: string
  termsVersion: string
}
