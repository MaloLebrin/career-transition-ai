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

/** Libellé de la ligne Stripe Checkout (facture et page de paiement). */
export const RESULTS_PRODUCT_NAME = 'Forfait Transition Carrière — accès complet aux résultats'

/** Routes du parcours de paiement (#102), côté candidat. */
export const BILLING_PATHS = {
  home: '/dashboard/candidat',
  synthesis: '/dashboard/candidat/synthesis',
  offer: '/dashboard/candidat/offre',
  checkout: '/dashboard/candidat/offre/checkout',
  success: '/dashboard/candidat/billing/success',
  cancel: '/dashboard/candidat/billing/cancel',
} as const

/** Chemin public du webhook Stripe (#104) : hors `guest`/`auth`, exempté de CSRF, signé. */
export const STRIPE_WEBHOOK_PATH = '/webhooks/stripe'

/**
 * Événements Stripe traités par `StripeWebhooksService` (#104) ; ce sont aussi
 * ceux à abonner dans le tableau de bord Stripe (docs/STRIPE.md). Tout autre
 * type est accusé réception et ignoré.
 */
export const STRIPE_WEBHOOK_EVENTS = {
  CHECKOUT_COMPLETED: 'checkout.session.completed',
  ASYNC_PAYMENT_SUCCEEDED: 'checkout.session.async_payment_succeeded',
  ASYNC_PAYMENT_FAILED: 'checkout.session.async_payment_failed',
  CHECKOUT_EXPIRED: 'checkout.session.expired',
  CHARGE_REFUNDED: 'charge.refunded',
} as const

export type StripeWebhookEvent = (typeof STRIPE_WEBHOOK_EVENTS)[keyof typeof STRIPE_WEBHOOK_EVENTS]

export const stripeWebhookEventValues = Object.values(STRIPE_WEBHOOK_EVENTS)

/** Issue du traitement d'un événement webhook (#104). */
export const WEBHOOK_OUTCOMES = {
  /** Événement traité et journalisé. */
  PROCESSED: 'processed',
  /** Déjà traité (rejeu Stripe) : aucun effet. */
  DUPLICATE: 'duplicate',
  /** Type non suivi : accusé réception seulement. */
  IGNORED: 'ignored',
  /** Type suivi mais aucun paiement local correspondant. */
  UNMATCHED: 'unmatched',
} as const

export type WebhookOutcome = (typeof WEBHOOK_OUTCOMES)[keyof typeof WEBHOOK_OUTCOMES]

/** Motif posé sur `candidate_payments.revoke_reason` lors d'un remboursement Stripe. */
export const STRIPE_REFUND_REVOKE_REASON = 'Remboursement Stripe'

/**
 * Motif posé sur un paiement Stripe encaissé alors que le candidat avait déjà
 * un droit actif : la ligne reste `paid` (l'argent est reçu) mais révoquée,
 * à rembourser manuellement dans Stripe (docs/STRIPE.md).
 */
export const DUPLICATE_PAYMENT_REVOKE_REASON = 'Doublon : paiement à rembourser dans Stripe'

/** Back-office super admin des particuliers et des paiements (#107). */
export const BILLING_ADMIN_PATHS = {
  b2c: '/dashboard/super-admin/b2c',
  payments: '/dashboard/super-admin/payments',
  grant: (employeeId: number) => `/dashboard/super-admin/b2c/${employeeId}/entitlement/grant`,
  revoke: (paymentId: number) => `/dashboard/super-admin/payments/${paymentId}/revoke`,
} as const

/** Taille de page des listes du back-office B2C (paiements, particuliers ; #107). */
export const ADMIN_LIST_PAGE_SIZE = 50

/** Taille de page de la liste des paiements du back-office (#107). */
export const PAYMENTS_PAGE_SIZE = ADMIN_LIST_PAGE_SIZE

/** Longueur maximale du motif de révocation d'un accès (#107). */
export const REVOKE_REASON_MAX = 500
