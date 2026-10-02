import CandidatePayment from '#models/candidate_payment'
import {
  BILLING_CURRENCY,
  DEFAULT_RESULTS_PRICE_CENTS,
  PAYMENT_PRODUCTS,
  PAYMENT_PROVIDERS,
  PAYMENT_STATUSES,
} from '#shared/constants/billing'
import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'

/** Par défaut : paiement Stripe en attente. États `paid`, `refunded`, `revoked`, `manual`. */
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
      currency: BILLING_CURRENCY,
      stripeCheckoutSessionId: `cs_test_${faker.string.alphanumeric(24)}`,
      stripePaymentIntentId: null as string | null,
      paidAt: null as DateTime | null,
      refundedAt: null as DateTime | null,
      revokedAt: null as DateTime | null,
      revokeReason: null as string | null,
      grantedByUserId: null as number | null,
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
  })
  .state('refunded', (payment, { faker }) => {
    payment.status = PAYMENT_STATUSES.REFUNDED
    payment.paidAt = DateTime.now().minus({ days: 3 })
    payment.refundedAt = DateTime.now().minus({ hours: 2 })
    payment.stripePaymentIntentId = `pi_test_${faker.string.alphanumeric(24)}`
  })
  .state('revoked', (payment) => {
    payment.status = PAYMENT_STATUSES.PAID
    payment.paidAt = DateTime.now().minus({ days: 3 })
    payment.revokedAt = DateTime.now().minus({ hours: 1 })
    payment.revokeReason = 'Révocation de test'
  })
  .state('manual', (payment) => {
    payment.provider = PAYMENT_PROVIDERS.MANUAL
    payment.status = PAYMENT_STATUSES.PAID
    payment.amountCents = 0
    payment.stripeCheckoutSessionId = null
    payment.stripePaymentIntentId = null
    payment.paidAt = DateTime.now()
  })
  .build()
