import CandidatePayment from '#models/candidate_payment'
import Employee from '#models/employee'
import { EntitlementsService } from '#services/entitlements_service'
import { PAYMENT_STATUSES } from '#shared/constants/billing'
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

  public async findByCheckoutSession(sessionId: string): Promise<CandidatePayment | null> {
    return CandidatePayment.query().where('stripeCheckoutSessionId', sessionId).first()
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
}
