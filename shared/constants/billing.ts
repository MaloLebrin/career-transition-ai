/**
 * Facturation du forfait particuliers (épic B2C #90, domaine « droits d'accès » #94).
 * Les valeurs alimentent les contraintes CHECK de `candidate_payments`.
 */

/** Produit acheté. Un seul aujourd'hui : l'accès complet aux résultats. */
export const PAYMENT_PRODUCTS = {
  RESULTS_ACCESS: 'results_access',
} as const

export type PaymentProduct = (typeof PAYMENT_PRODUCTS)[keyof typeof PAYMENT_PRODUCTS]

export const paymentProductValues = Object.values(PAYMENT_PRODUCTS)

/** Origine du paiement : Stripe Checkout (#102) ou octroi manuel par un super admin (#107). */
export const PAYMENT_PROVIDERS = {
  STRIPE: 'stripe',
  MANUAL: 'manual',
} as const

export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[keyof typeof PAYMENT_PROVIDERS]

export const paymentProviderValues = Object.values(PAYMENT_PROVIDERS)

/**
 * Cycle de vie d'un paiement. Seul `paid` (sans `revoked_at`) ouvre les
 * droits ; `refunded` les retire, `revoked_at` aussi sans changer le statut.
 */
export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  CANCELED: 'canceled',
  REFUNDED: 'refunded',
} as const

export type PaymentStatus = (typeof PAYMENT_STATUSES)[keyof typeof PAYMENT_STATUSES]

export const paymentStatusValues = Object.values(PAYMENT_STATUSES)

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PAYMENT_STATUSES.PENDING]: 'En attente',
  [PAYMENT_STATUSES.PAID]: 'Payé',
  [PAYMENT_STATUSES.FAILED]: 'Échoué',
  [PAYMENT_STATUSES.CANCELED]: 'Annulé',
  [PAYMENT_STATUSES.REFUNDED]: 'Remboursé',
}

/** Devise unique du forfait (code ISO 4217 en minuscules, comme Stripe). */
export const BILLING_CURRENCY = 'eur'

/** Prix TTC par défaut du forfait, en centimes (à confirmer par le PO — question 1 de #90). */
export const DEFAULT_RESULTS_PRICE_CENTS = 4900
