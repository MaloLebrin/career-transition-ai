import CandidatePayment from '#models/candidate_payment'
import {
  BILLING_CURRENCY,
  DEFAULT_RESULTS_PRICE_CENTS,
  PAYMENT_PRODUCTS,
  PAYMENT_PROVIDERS,
  PAYMENT_STATUSES,
  STRIPE_REFUND_REVOKE_REASON,
} from '#shared/constants/billing'
import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'

/**
 * Par défaut : paiement Stripe en attente. États `paid`, `refunded`, `revoked`,
 * `manual`, et pour les codes promo (#139) `discounted` (-20 %) et `free` (100 %).
 */
export const CandidatePaymentFactory = factory
  .define(CandidatePayment, ({ faker }) => {
    return {
      employeeId: 0, // à surcharger
      userId: null as number | null,
      organizationId: 0, // à surcharger
      productCode: PAYMENT_PRODUCTS.RESULTS_ACCESS,
      provider: PAYMENT_PROVIDERS.STRIPE,
      status: PAYMENT_STATUSES.PENDING,
      amountCents: DEFAULT_RESULTS_PRICE_CENTS,
      discountCents: 0,
      promoCode: null as string | null,
      stripePromotionCodeId: null as string | null,
      currency: BILLING_CURRENCY,
      stripeCheckoutSessionId: `cs_test_${faker.string.alphanumeric(24)}`,
      stripePaymentIntentId: null as string | null,
      paidAt: null as DateTime | null,
      refundedAt: null as DateTime | null,
      revokedAt: null as DateTime | null,
      revokeReason: null as string | null,
      grantedByUserId: null as number | null,
      revokedByUserId: null as number | null,
      unlockEffectsAt: null as DateTime | null,
      revokeEffectsAt: null as DateTime | null,
      withdrawalWaivedAt: null as DateTime | null,
    }
  })
  .state('pending', (payment) => {
    payment.status = PAYMENT_STATUSES.PENDING
    payment.paidAt = null
  })
  .state('paid', (payment, { faker }) => {
    payment.status = PAYMENT_STATUSES.PAID
    payment.paidAt = DateTime.now().minus({ days: 1 })
    payment.stripePaymentIntentId = `pi_test_${faker.string.alphanumeric(24)}`
    payment.withdrawalWaivedAt = payment.paidAt
    payment.unlockEffectsAt = payment.paidAt
  })
  .state('refunded', (payment, { faker }) => {
    payment.status = PAYMENT_STATUSES.REFUNDED
    payment.paidAt = DateTime.now().minus({ days: 3 })
    payment.refundedAt = DateTime.now().minus({ hours: 2 })
    payment.revokedAt = payment.refundedAt
    payment.revokeReason = STRIPE_REFUND_REVOKE_REASON
    payment.unlockEffectsAt = payment.paidAt
    payment.revokeEffectsAt = payment.refundedAt
    payment.stripePaymentIntentId = `pi_test_${faker.string.alphanumeric(24)}`
  })
  .state('revoked', (payment) => {
    payment.status = PAYMENT_STATUSES.PAID
    payment.paidAt = DateTime.now().minus({ days: 3 })
    payment.revokedAt = DateTime.now().minus({ hours: 1 })
    payment.revokeReason = 'Révocation de test'
    payment.unlockEffectsAt = payment.paidAt
    payment.revokeEffectsAt = payment.revokedAt
  })
  /** Payé avec un code promo à -20 % (#139) : montant encaissé 39,20 €, remise 9,80 €. */
  .state('discounted', (payment, { faker }) => {
    payment.status = PAYMENT_STATUSES.PAID
    payment.paidAt = DateTime.now().minus({ days: 1 })
    payment.stripePaymentIntentId = `pi_test_${faker.string.alphanumeric(24)}`
    payment.withdrawalWaivedAt = payment.paidAt
    payment.unlockEffectsAt = payment.paidAt
    payment.discountCents = Math.round(DEFAULT_RESULTS_PRICE_CENTS * 0.2)
    payment.amountCents = DEFAULT_RESULTS_PRICE_CENTS - payment.discountCents
    payment.promoCode = 'BIENVENUE20'
    payment.stripePromotionCodeId = `promo_test_${faker.string.alphanumeric(24)}`
  })
  /** Code promo à 100 % (#139) : réglé sans PaymentIntent, 0 € encaissé. */
  .state('free', (payment, { faker }) => {
    payment.status = PAYMENT_STATUSES.PAID
    payment.paidAt = DateTime.now().minus({ days: 1 })
    payment.stripePaymentIntentId = null
    payment.withdrawalWaivedAt = payment.paidAt
    payment.unlockEffectsAt = payment.paidAt
    payment.discountCents = DEFAULT_RESULTS_PRICE_CENTS
    payment.amountCents = 0
    payment.promoCode = 'OFFERT100'
    payment.stripePromotionCodeId = `promo_test_${faker.string.alphanumeric(24)}`
  })
  .state('manual', (payment) => {
    payment.provider = PAYMENT_PROVIDERS.MANUAL
    payment.status = PAYMENT_STATUSES.PAID
    payment.amountCents = 0
    payment.stripeCheckoutSessionId = null
    payment.stripePaymentIntentId = null
    payment.paidAt = DateTime.now()
    payment.unlockEffectsAt = payment.paidAt
  })
  .build()
