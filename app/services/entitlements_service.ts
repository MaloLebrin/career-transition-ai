import billingConfig from '#config/billing'
import { EntitlementAlreadyGrantedError, PaymentNotFoundError } from '#exceptions/billing_errors'
import CandidatePayment from '#models/candidate_payment'
import Employee from '#models/employee'
import type User from '#models/user'
import { ACCOUNT_TYPES, B2C_FREE_EXERCISE_TYPES } from '#shared/constants/b2c'
import {
  BILLING_CURRENCY,
  PAYMENT_PRODUCTS,
  PAYMENT_PROVIDERS,
  PAYMENT_STATUSES,
} from '#shared/constants/billing'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import type { ResultsEntitlement } from '#shared/types/billing/entitlement'
import type { RevokeEntitlementInput } from '#shared/types/billing/inputs'
import { DateTime } from 'luxon'

/**
 * Droits d'accès aux résultats (#94) : « ce candidat a-t-il payé ? »
 *
 * Un droit est ouvert par un paiement `paid` non révoqué. Les candidats B2B
 * ont toujours accès (l'accès est porté par le contrat du cabinet) : les
 * helpers de `#shared/helpers/b2c_access` restent ainsi neutres pour eux.
 *
 * `onResultsUnlocked` / `onResultsRevoked` sont les points d'extension du
 * webhook Stripe (#104) : relance des analyses IA différées, notifications.
 */
export class EntitlementsService {
  /** Paiement qui ouvre l'accès aujourd'hui, ou `null`. */
  public async findActivePayment(employeeId: number): Promise<CandidatePayment | null> {
    return CandidatePayment.query()
      .where('employeeId', employeeId)
      .where('status', PAYMENT_STATUSES.PAID)
      .whereNull('revokedAt')
      .orderBy('paidAt', 'desc')
      .first()
  }

  public async hasResultsAccess(employeeId: number): Promise<boolean> {
    return Boolean(await this.findActivePayment(employeeId))
  }

  public async forEmployee(employee: Employee): Promise<ResultsEntitlement> {
    const hasPaidAccess =
      employee.accountType === ACCOUNT_TYPES.B2C ? await this.hasResultsAccess(employee.id) : true

    return {
      accountType: employee.accountType,
      hasPaidAccess,
      freeExerciseTypes: [...B2C_FREE_EXERCISE_TYPES],
      paymentsEnabled: billingConfig.paymentsEnabled,
    }
  }

  /** `null` pour tout rôle autre que candidat, ou pour un candidat sans fiche (onboarding). */
  public async forUser(user: User): Promise<ResultsEntitlement | null> {
    if (user.role !== USERS_ROLES.EMPLOYEE) return null
    const employee = await Employee.query().where('userId', user.id).first()
    return employee ? this.forEmployee(employee) : null
  }

  /**
   * Octroi manuel par un super admin (#107) : paiement `manual` à 0 €, payé
   * immédiatement. Refusé si un droit est déjà ouvert.
   */
  public async grantManual(employee: Employee, actor: User): Promise<CandidatePayment> {
    if (await this.hasResultsAccess(employee.id)) {
      throw new EntitlementAlreadyGrantedError()
    }

    const payment = await CandidatePayment.create({
      employeeId: employee.id,
      userId: employee.userId,
      organizationId: employee.organizationId,
      productCode: PAYMENT_PRODUCTS.RESULTS_ACCESS,
      provider: PAYMENT_PROVIDERS.MANUAL,
      status: PAYMENT_STATUSES.PAID,
      amountCents: 0,
      currency: BILLING_CURRENCY,
      stripeCheckoutSessionId: null,
      stripePaymentIntentId: null,
      paidAt: DateTime.now(),
      grantedByUserId: actor.id,
    })

    await this.onResultsUnlocked(employee, payment)
    return payment
  }

  /**
   * Retrait d'un droit ouvert (#107) : le paiement garde son statut, `revoked_at`
   * et le motif sont posés. Un paiement inconnu ou qui n'ouvre plus de droit → 404.
   */
  public async revoke(input: RevokeEntitlementInput, actor: User): Promise<CandidatePayment> {
    const payment = await CandidatePayment.query()
      .where('id', input.paymentId)
      .where('status', PAYMENT_STATUSES.PAID)
      .whereNull('revokedAt')
      .first()
    if (!payment) {
      throw new PaymentNotFoundError()
    }

    payment.revokedAt = DateTime.now()
    payment.revokeReason = `${input.reason.trim()} (par l’utilisateur #${actor.id})`
    await payment.save()

    if (payment.employeeId) {
      const employee = await Employee.find(payment.employeeId)
      if (employee) await this.onResultsRevoked(employee, payment)
    }
    return payment
  }

  /** Point d'extension (#104) : analyses IA différées, notification `results_unlocked`. */
  protected async onResultsUnlocked(
    _employee: Employee,
    _payment: CandidatePayment
  ): Promise<void> {}

  /** Point d'extension (#104) : notification `results_access_revoked`. */
  protected async onResultsRevoked(
    _employee: Employee,
    _payment: CandidatePayment
  ): Promise<void> {}
}
