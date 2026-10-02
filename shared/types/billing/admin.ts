import type { PaymentProvider, PaymentStatus } from '#shared/constants/billing'

/** Un particulier vu du back-office super admin (#107). */
export interface B2cCandidateRow {
  id: number
  name: string
  email: string
  emailVerified: boolean
  createdAt: string | null
  hasPaidAccess: boolean
  /** Paiement qui ouvre l'accès aujourd'hui (cible d'une révocation), `null` sinon. */
  activePaymentId: number | null
  expert: { id: number; name: string } | null
  pendingExpertRequest: boolean
}

/** Indicateurs B2C de l'accueil super admin et de la page des particuliers (#107). */
export interface B2cStats {
  candidates: number
  paid: number
  /** Somme des paiements Stripe `paid` du mois civil en cours, en centimes. */
  monthRevenueCents: number
  currency: string
  pendingExpertRequests: number
}

/** Compteurs de l'accueil super admin (#107 : `home` passe par le service). */
export interface SuperAdminHomeStats {
  organizations: number
  users: number
  b2c: B2cStats
}

/** Un paiement du forfait vu du back-office (#107). */
export interface PaymentRow {
  id: number
  candidate: { id: number; name: string; email: string } | null
  provider: PaymentProvider
  status: PaymentStatus
  amountCents: number
  currency: string
  paidAt: string | null
  refundedAt: string | null
  revokedAt: string | null
  revokeReason: string | null
  grantedBy: { id: number; name: string } | null
  createdAt: string | null
  /** Ce paiement ouvre-t-il l'accès aujourd'hui ? */
  grantsAccess: boolean
}

export interface PaymentsListFilter {
  status: PaymentStatus | null
  page: number
}

export interface PaymentsListResult {
  items: PaymentRow[]
  filter: PaymentsListFilter
  total: number
  lastPage: number
}

export interface RevokePaymentInput {
  paymentId: number
  reason: string
}
