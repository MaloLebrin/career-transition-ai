import CandidatePayment from '#models/candidate_payment'
import Employee from '#models/employee'
import { EntitlementsService } from '#services/entitlements_service'
import { PAYMENT_STATUSES, STRIPE_REFUND_REVOKE_REASON } from '#shared/constants/billing'
import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'

/**
 * Cycle de vie d'un paiement du forfait (#102, complété par le webhook #104).
 *
 * `markPaid` est **idempotent** : la mise à jour ne porte que sur une ligne
 * encore `pending`, si bien que la réconciliation de la page de succès et le
 * webhook peuvent arriver dans n'importe quel ordre, ou deux fois, sans
 * ouvrir le droit deux fois ni relancer deux fois les analyses IA.
 */
@inject()
export class PaymentsService {
  constructor(private entitlements: EntitlementsService) {}

  public async findById(id: number): Promise<CandidatePayment | null> {
    return Number.isInteger(id) && id > 0 ? CandidatePayment.find(id) : null
  }

  public async findByCheckoutSession(sessionId: string): Promise<CandidatePayment | null> {
    return CandidatePayment.query().where('stripeCheckoutSessionId', sessionId).first()
  }

  public async findByPaymentIntent(paymentIntentId: string): Promise<CandidatePayment | null> {
    return CandidatePayment.query().where('stripePaymentIntentId', paymentIntentId).first()
  }

  /** `true` si ce passage a réellement ouvert le droit, `false` s'il l'était déjà. */
  public async markPaid(
    payment: CandidatePayment,
    details: { paymentIntentId: string | null; paidAt?: DateTime }
  ): Promise<boolean> {
    const [affected] = await CandidatePayment.query()
      .where('id', payment.id)
      .where('status', PAYMENT_STATUSES.PENDING)
      .update({
        status: PAYMENT_STATUSES.PAID,
        paidAt: (details.paidAt ?? DateTime.now()).toSQL(),
        stripePaymentIntentId: details.paymentIntentId,
      })
    if (Number(affected) === 0) return false

    await payment.refresh()
    if (payment.employeeId) {
      const employee = await Employee.find(payment.employeeId)
      if (employee) await this.entitlements.unlockResults(employee, payment)
    }
    return true
  }

  /** Paiement asynchrone refusé (#104) : `pending` → `failed`, sans effet sinon. */
  public async markFailed(payment: CandidatePayment): Promise<boolean> {
    return this.transitionFromPending(payment, PAYMENT_STATUSES.FAILED)
  }

  /** Session Checkout expirée sans paiement (#104) : `pending` → `canceled`. */
  public async markCanceled(payment: CandidatePayment): Promise<boolean> {
    return this.transitionFromPending(payment, PAYMENT_STATUSES.CANCELED)
  }

  /**
   * Remboursement Stripe (#104) : `paid` → `refunded`, `refunded_at` et
   * `revoked_at` posés, puis l'accès est retiré (`onResultsRevoked`).
   * Idempotent : un second événement sur le même paiement ne fait rien.
   */
  public async refund(
    payment: CandidatePayment,
    details: { refundedAt?: DateTime } = {}
  ): Promise<boolean> {
    const now = DateTime.now()
    const [affected] = await CandidatePayment.query()
      .where('id', payment.id)
      .where('status', PAYMENT_STATUSES.PAID)
      .update({
        status: PAYMENT_STATUSES.REFUNDED,
        refundedAt: (details.refundedAt ?? now).toSQL(),
        revokedAt: now.toSQL(),
        revokeReason: STRIPE_REFUND_REVOKE_REASON,
      })
    if (Number(affected) === 0) return false

    await payment.refresh()
    if (payment.employeeId) {
      const employee = await Employee.find(payment.employeeId)
      if (employee) await this.entitlements.revokeResults(employee, payment)
    }
    return true
  }

  private async transitionFromPending(
    payment: CandidatePayment,
    status: typeof PAYMENT_STATUSES.FAILED | typeof PAYMENT_STATUSES.CANCELED
  ): Promise<boolean> {
    const [affected] = await CandidatePayment.query()
      .where('id', payment.id)
      .where('status', PAYMENT_STATUSES.PENDING)
      .update({ status })
    if (Number(affected) === 0) return false
    await payment.refresh()
    return true
  }
}
