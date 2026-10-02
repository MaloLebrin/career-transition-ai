import billingConfig from '#config/billing'
import {
  CheckoutSessionNotFoundError,
  EmailNotVerifiedError,
  EntitlementAlreadyGrantedError,
  PaymentsDisabledError,
} from '#exceptions/billing_errors'
import { CandidateProfileNotFoundError } from '#exceptions/candidate_data_errors'
import CandidatePayment from '#models/candidate_payment'
import Employee from '#models/employee'
import type User from '#models/user'
import { PaymentsService } from '#services/billing/payments_service'
import { StripePaymentGateway } from '#services/billing/stripe_payment_gateway'
import { EntitlementsService } from '#services/entitlements_service'
import { ACCOUNT_TYPES } from '#shared/constants/b2c'
import {
  BILLING_PATHS,
  PAYMENT_PRODUCTS,
  PAYMENT_PROVIDERS,
  PAYMENT_STATUSES,
  RESULTS_PRODUCT_NAME,
} from '#shared/constants/billing'
import { TERMS_VERSION } from '#shared/constants/legal'
import type {
  CheckoutReconcileResult,
  CheckoutStartResult,
  OfferView,
} from '#shared/types/billing/checkout'
import { appUrl } from '#utils/app_url'
import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'

/**
 * Achat du forfait par un particulier (#102).
 *
 * `start` : contrôles (paiement activé, compte B2C, e-mail vérifié, pas déjà
 * payé), paiement `pending`, session Stripe Checkout, redirection externe.
 * `reconcile` : au retour sur la page de succès, relit la session chez Stripe
 * et débloque si elle est payée — le candidat n'attend pas le webhook (#104),
 * qui reste la source de vérité en cas de fermeture d'onglet.
 */
@inject()
export class CheckoutService {
  constructor(
    private gateway: StripePaymentGateway,
    private entitlements: EntitlementsService,
    private payments: PaymentsService
  ) {}

  public async offerFor(user: User): Promise<OfferView> {
    const employee = await this.candidateFor(user)
    return {
      hasPaidAccess: await this.entitlements.hasResultsAccess(employee.id),
      emailVerified: Boolean(user.emailVerifiedAt),
      paymentsEnabled: billingConfig.paymentsEnabled,
      priceCents: billingConfig.resultsPriceCents,
      currency: billingConfig.currency,
      termsVersion: TERMS_VERSION,
    }
  }

  public async start(user: User): Promise<CheckoutStartResult> {
    if (!billingConfig.paymentsEnabled) throw new PaymentsDisabledError()
    const employee = await this.candidateFor(user)
    if (!user.emailVerifiedAt) throw new EmailNotVerifiedError()
    if (await this.entitlements.hasResultsAccess(employee.id)) {
      throw new EntitlementAlreadyGrantedError()
    }

    const payment = await CandidatePayment.create({
      employeeId: employee.id,
      userId: user.id,
      organizationId: employee.organizationId,
      productCode: PAYMENT_PRODUCTS.RESULTS_ACCESS,
      provider: PAYMENT_PROVIDERS.STRIPE,
      status: PAYMENT_STATUSES.PENDING,
      amountCents: billingConfig.resultsPriceCents,
      currency: billingConfig.currency,
      stripeCheckoutSessionId: null,
      stripePaymentIntentId: null,
      // Renonciation expresse au droit de rétractation, cochée dans le formulaire.
      withdrawalWaivedAt: DateTime.now(),
    })

    const session = await this.gateway.createCheckoutSession({
      paymentId: payment.id,
      employeeId: employee.id,
      amountCents: payment.amountCents,
      currency: payment.currency,
      productName: RESULTS_PRODUCT_NAME,
      customerEmail: user.email,
      successUrl: appUrl(`${BILLING_PATHS.success}?session_id={CHECKOUT_SESSION_ID}`),
      cancelUrl: appUrl(BILLING_PATHS.cancel),
    })

    payment.stripeCheckoutSessionId = session.id
    await payment.save()

    return { paymentId: payment.id, url: session.url }
  }

  public async reconcile(user: User, sessionId: string): Promise<CheckoutReconcileResult> {
    const employee = await this.candidateFor(user)
    const payment = await CandidatePayment.query()
      .where('stripeCheckoutSessionId', sessionId)
      .where('employeeId', employee.id)
      .first()
    if (!payment) throw new CheckoutSessionNotFoundError()
    if (payment.status === PAYMENT_STATUSES.PAID) {
      return { paymentId: payment.id, paid: true }
    }

    const session = await this.gateway.retrieveCheckoutSession(sessionId)
    if (!session) throw new CheckoutSessionNotFoundError()
    if (session.paymentStatus !== 'paid') {
      return { paymentId: payment.id, paid: false }
    }

    await this.payments.markPaid(payment, { paymentIntentId: session.paymentIntentId })
    return { paymentId: payment.id, paid: true }
  }

  /** Fiche du particulier connecté ; les candidats B2B n'ont rien à acheter. */
  private async candidateFor(user: User): Promise<Employee> {
    const employee = await Employee.query()
      .where('userId', user.id)
      .where('organizationId', user.organizationId)
      .first()
    if (!employee) throw new CandidateProfileNotFoundError()
    if (employee.accountType !== ACCOUNT_TYPES.B2C) {
      throw new CandidateProfileNotFoundError('Le forfait est réservé aux particuliers.')
    }
    return employee
  }
}
