import CandidatePayment from '#models/candidate_payment'
import Employee from '#models/employee'
import { EntitlementsService } from '#services/entitlements_service'
import { reportError } from '#services/error_tracking_service'
import {
  DUPLICATE_PAYMENT_REVOKE_REASON,
  PAYMENT_STATUSES,
  STRIPE_REFUND_REVOKE_REASON,
} from '#shared/constants/billing'
import type { PaymentSettlement } from '#shared/types/billing/checkout'
import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'

/** Code SQLSTATE PostgreSQL d'une violation d'unicité. */
const UNIQUE_VIOLATION = '23505'

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

  /**
   * Recoupe ce que Stripe annonce (session, montant, devise) avec la ligne
   * locale. Un champ absent n'est pas comparé (événements allégés). Un écart
   * est signalé (`reportError`, ids seulement) et le paiement ne doit pas être débloqué.
   *
   * Montant : le prix catalogue annoncé par Stripe (`amount_subtotal`, avant
   * remise d'un code promo, #139) est comparé à `grossAmountCents`
   * (`amount_cents + discount_cents`) — invariant valable pour une ligne
   * `pending` comme pour une ligne déjà réglée (rejeu du webhook après la
   * réconciliation). Sans sous-total, `amount_total` sert de repli : un
   * paiement remisé donne alors un écart, côté sûr.
   */
  public sessionMatches(
    payment: CandidatePayment,
    stripe: {
      sessionId?: string | null
      amountTotal?: number | null
      amountSubtotal?: number | null
      currency?: string | null
    }
  ): boolean {
    const mismatches: string[] = []
    if (
      stripe.sessionId &&
      payment.stripeCheckoutSessionId &&
      stripe.sessionId !== payment.stripeCheckoutSessionId
    ) {
      mismatches.push('session')
    }
    const announced =
      typeof stripe.amountSubtotal === 'number' ? stripe.amountSubtotal : stripe.amountTotal
    if (typeof announced === 'number' && announced !== payment.grossAmountCents) {
      mismatches.push('amount')
    }
    if (stripe.currency && stripe.currency.toLowerCase() !== payment.currency.toLowerCase()) {
      mismatches.push('currency')
    }
    if (mismatches.length === 0) return true
    reportError(new Error('Paiement Stripe incohérent avec la ligne locale'), {
      tags: { feature: 'stripe_payment', step: 'mismatch' },
      extra: { paymentId: payment.id, mismatches: mismatches.join(',') },
    })
    return false
  }

  /**
   * `true` si ce passage a réellement ouvert le droit, `false` sinon.
   *
   * Effets rejouables : si le paiement est déjà `paid` mais que ses effets
   * (jobs IA) n'ont pas abouti (`unlock_effects_at` nul), ils sont ré-exécutés
   * à la reprise du webhook — sans rouvrir le droit (retourne `false`).
   *
   * Doublon : si le candidat a déjà un droit actif, le paiement est encaissé
   * mais posé révoqué (`DUPLICATE_PAYMENT_REVOKE_REASON`) et signalé par
   * `reportError` ; aucun remboursement automatique (docs/STRIPE.md).
   *
   * Règlement (#139) : le montant réellement encaissé, la remise et le code
   * promo sont écrits dans la même mise à jour `pending → paid` ; une ligne
   * déjà réglée n'est pas réécrite.
   */
  public async markPaid(
    payment: CandidatePayment,
    details: PaymentSettlement & { paidAt?: DateTime }
  ): Promise<boolean> {
    const paidAt = (details.paidAt ?? DateTime.now()).toSQL()
    const settlement = settlementColumns(payment, details)
    const pending = () =>
      CandidatePayment.query().where('id', payment.id).where('status', PAYMENT_STATUSES.PENDING)

    if (payment.employeeId) {
      const active = await this.entitlements.findActivePayment(payment.employeeId)
      if (active && active.id !== payment.id) {
        return this.markDuplicate(payment, pending, settlement, paidAt)
      }
    }

    let affected: number
    try {
      ;[affected] = (await pending().update({
        status: PAYMENT_STATUSES.PAID,
        paidAt,
        ...settlement,
      })) as number[]
    } catch (error) {
      // Course perdue contre un autre paiement actif (index unique partiel).
      if ((error as { code?: string }).code === UNIQUE_VIOLATION) {
        return this.markDuplicate(payment, pending, settlement, paidAt)
      }
      throw error
    }

    if (Number(affected) === 0) {
      await payment.refresh()
      if (
        payment.status === PAYMENT_STATUSES.PAID &&
        !payment.revokedAt &&
        !payment.unlockEffectsAt
      ) {
        await this.unlockEffects(payment)
      }
      return false
    }

    await payment.refresh()
    await this.unlockEffects(payment)
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
   * Remboursement total Stripe (#104) : `paid` → `refunded`, `refunded_at` posé ;
   * `revoked_at` et le motif aussi, sauf si un super admin avait déjà révoqué
   * l'accès (on n'écrase ni la date ni le motif, et on ne renotifie pas). Puis
   * l'accès est retiré (`onResultsRevoked`). Idempotent ; un remboursement déjà
   * enregistré dont les effets avaient échoué (`revoke_effects_at` nul) est rejoué.
   */
  public async refund(
    payment: CandidatePayment,
    details: { refundedAt?: DateTime } = {}
  ): Promise<boolean> {
    const now = DateTime.now()
    const refundedAt = (details.refundedAt ?? now).toSQL()
    const paid = () =>
      CandidatePayment.query().where('id', payment.id).where('status', PAYMENT_STATUSES.PAID)

    const [revoking] = await paid().whereNull('revokedAt').update({
      status: PAYMENT_STATUSES.REFUNDED,
      refundedAt,
      revokedAt: now.toSQL(),
      revokeReason: STRIPE_REFUND_REVOKE_REASON,
    })
    if (Number(revoking) > 0) {
      await payment.refresh()
      await this.revokeEffects(payment)
      return true
    }

    // Déjà révoqué à la main : seul le statut et la date de remboursement changent.
    const [alreadyRevoked] = await paid().update({
      status: PAYMENT_STATUSES.REFUNDED,
      refundedAt,
    })
    if (Number(alreadyRevoked) > 0) {
      await payment.refresh()
      return true
    }

    await payment.refresh()
    if (
      payment.status === PAYMENT_STATUSES.REFUNDED &&
      payment.revokeReason === STRIPE_REFUND_REVOKE_REASON &&
      !payment.revokeEffectsAt
    ) {
      await this.revokeEffects(payment)
    }
    return false
  }

  private async unlockEffects(payment: CandidatePayment): Promise<void> {
    if (!payment.employeeId) return
    const employee = await Employee.find(payment.employeeId)
    if (employee) await this.entitlements.runUnlockEffects(employee, payment)
  }

  private async revokeEffects(payment: CandidatePayment): Promise<void> {
    if (!payment.employeeId) return
    const employee = await Employee.find(payment.employeeId)
    if (employee) await this.entitlements.runRevokeEffects(employee, payment)
  }

  /** Paiement encaissé alors qu'un droit est déjà ouvert : conservé, révoqué, signalé. */
  private async markDuplicate(
    payment: CandidatePayment,
    pending: () => ReturnType<typeof CandidatePayment.query>,
    settlement: SettlementColumns,
    paidAt: string | null
  ): Promise<boolean> {
    const now = DateTime.now().toSQL()
    const [affected] = await pending().update({
      status: PAYMENT_STATUSES.PAID,
      paidAt,
      ...settlement,
      revokedAt: now,
      revokeReason: DUPLICATE_PAYMENT_REVOKE_REASON,
      unlockEffectsAt: now,
      revokeEffectsAt: now,
    })
    if (Number(affected) > 0) {
      reportError(new Error('Paiement Stripe en double : un droit actif existe déjà'), {
        tags: { feature: 'stripe_payment', step: 'duplicate_paid' },
        extra: { paymentId: payment.id, paymentIntentId: settlement.stripePaymentIntentId },
      })
    }
    await payment.refresh()
    return false
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

interface SettlementColumns {
  stripePaymentIntentId: string | null
  amountCents: number
  discountCents: number
  promoCode: string | null
  stripePromotionCodeId: string | null
}

/** Colonnes de règlement écrites au passage `paid` ; sans montant transmis, la ligne garde son prix (#139). */
function settlementColumns(
  payment: CandidatePayment,
  settlement: PaymentSettlement
): SettlementColumns {
  return {
    stripePaymentIntentId: settlement.paymentIntentId,
    amountCents:
      typeof settlement.amountTotalCents === 'number'
        ? settlement.amountTotalCents
        : payment.amountCents,
    discountCents: settlement.discountCents ?? 0,
    promoCode: settlement.promoCode ?? null,
    stripePromotionCodeId: settlement.promotionCodeId ?? null,
  }
}
