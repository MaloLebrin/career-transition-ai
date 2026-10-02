import billingConfig from '#config/billing'
import { EntitlementAlreadyGrantedError, PaymentNotFoundError } from '#exceptions/billing_errors'
import { CandidateProfileNotFoundError } from '#exceptions/candidate_data_errors'
import AnalyzeExerciseQualitativeJob from '#jobs/analyze_exercise_qualitative_job'
import CandidatePayment from '#models/candidate_payment'
import Employee from '#models/employee'
import ExerciseResult from '#models/exercise_result'
import type User from '#models/user'
import { CandidateNotificationsService } from '#services/candidate_notifications_service'
import { reportError } from '#services/error_tracking_service'
import { ACCOUNT_TYPES, B2C_FREE_EXERCISE_TYPES } from '#shared/constants/b2c'
import {
  BILLING_CURRENCY,
  PAYMENT_PRODUCTS,
  PAYMENT_PROVIDERS,
  PAYMENT_STATUSES,
  REVOKE_REASON_MAX,
} from '#shared/constants/billing'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import type { ResultsEntitlement } from '#shared/types/billing/entitlement'
import { exerciceResultStatusValues } from '#shared/constants/exercises'
import type { RevokeEntitlementInput } from '#shared/types/billing/inputs'
import { QUEUE_NAMES } from '#utils/queues/queue_names'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

/** Code SQLSTATE PostgreSQL d'une violation d'unicité. */
const UNIQUE_VIOLATION = '23505'

/**
 * Droits d'accès aux résultats (#94) : « ce candidat a-t-il payé ? »
 *
 * Un droit est ouvert par un paiement `paid` non révoqué. Les candidats B2B
 * ont toujours accès (l'accès est porté par le contrat du cabinet) : les
 * helpers de `#shared/helpers/b2c_access` restent ainsi neutres pour eux.
 *
 * `onResultsUnlocked` / `onResultsRevoked` (#104) : au déblocage, les
 * exercices complétés sans analyse (verrouillés jusque-là) partent en analyse
 * IA et le particulier est prévenu ; au retrait, il est prévenu aussi.
 *
 * Effets de bord rejouables : `runUnlockEffects` / `runRevokeEffects` posent
 * `unlock_effects_at` / `revoke_effects_at` une fois les effets exécutés, ce
 * qui permet à `PaymentsService` de les rejouer à la reprise d'un webhook
 * (docs/STRIPE.md).
 */
@inject()
export class EntitlementsService {
  constructor(private notifications: CandidateNotificationsService) {}

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
   * immédiatement. Atomique : la fiche est verrouillée (`FOR UPDATE`) le temps
   * de vérifier qu'aucun droit n'est ouvert et de créer le paiement ; l'index
   * unique partiel `candidate_payments_one_active_per_employee` fait foi en
   * dernier recours. Refusé si un droit est déjà ouvert (409).
   */
  public async grantManual(employee: Employee, actor: User): Promise<CandidatePayment> {
    let payment: CandidatePayment
    try {
      payment = await db.transaction(async (trx) => {
        const locked = await Employee.query({ client: trx })
          .where('id', employee.id)
          .forUpdate()
          .first()
        if (!locked) throw new CandidateProfileNotFoundError()

        const active = await CandidatePayment.query({ client: trx })
          .where('employeeId', employee.id)
          .where('status', PAYMENT_STATUSES.PAID)
          .whereNull('revokedAt')
          .first()
        if (active) throw new EntitlementAlreadyGrantedError()

        return CandidatePayment.create(
          {
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
          },
          { client: trx }
        )
      })
    } catch (error) {
      if ((error as { code?: string }).code === UNIQUE_VIOLATION) {
        throw new EntitlementAlreadyGrantedError()
      }
      throw error
    }

    // Après commit : un effet qui échoue ne doit pas annuler l'octroi ni
    // renvoyer une 500 à l'admin (le marqueur reste nul, l'erreur est remontée).
    try {
      await this.runUnlockEffects(employee, payment)
    } catch (error) {
      reportError(error, {
        tags: { feature: 'entitlements', step: 'grant_effects' },
        extra: { paymentId: payment.id },
      })
    }
    return payment
  }

  /**
   * Retrait d'un droit ouvert (#107) : le paiement garde son statut, `revoked_at`,
   * le motif et l'auteur (`revoked_by_user_id`) sont posés. Un paiement inconnu
   * ou qui n'ouvre plus de droit → 404. Les effets de bord ne font pas échouer
   * la révocation.
   */
  public async revoke(input: RevokeEntitlementInput, actor: User): Promise<CandidatePayment> {
    const [affected] = await CandidatePayment.query()
      .where('id', input.paymentId)
      .where('status', PAYMENT_STATUSES.PAID)
      .whereNull('revokedAt')
      .update({
        revokedAt: DateTime.now().toSQL(),
        revokeReason: input.reason.trim().slice(0, REVOKE_REASON_MAX),
        revokedByUserId: actor.id,
      })
    if (Number(affected) === 0) {
      throw new PaymentNotFoundError()
    }

    const payment = await CandidatePayment.findOrFail(input.paymentId)
    try {
      if (payment.employeeId) {
        const employee = await Employee.find(payment.employeeId)
        if (employee) await this.runRevokeEffects(employee, payment)
      }
    } catch (error) {
      reportError(error, {
        tags: { feature: 'entitlements', step: 'revoke_effects' },
        extra: { paymentId: payment.id },
      })
    }
    return payment
  }

  /** Exécute les effets du déblocage puis pose `unlock_effects_at`. */
  public async runUnlockEffects(employee: Employee, payment: CandidatePayment): Promise<void> {
    await this.unlockResults(employee, payment)
    await this.stampEffects(payment, 'unlockEffectsAt')
  }

  /** Exécute les effets du retrait de droit puis pose `revoke_effects_at`. */
  public async runRevokeEffects(employee: Employee, payment: CandidatePayment): Promise<void> {
    await this.revokeResults(employee, payment)
    await this.stampEffects(payment, 'revokeEffectsAt')
  }

  private async stampEffects(
    payment: CandidatePayment,
    column: 'unlockEffectsAt' | 'revokeEffectsAt'
  ): Promise<void> {
    const now = DateTime.now()
    await CandidatePayment.query()
      .where('id', payment.id)
      .update({ [column]: now.toSQL() })
    payment[column] = now
  }

  /** Droit ouvert par un paiement confirmé (#102, `PaymentsService.markPaid`). */
  public async unlockResults(employee: Employee, payment: CandidatePayment): Promise<void> {
    await this.onResultsUnlocked(employee, payment)
  }

  /** Retrait d'un droit par remboursement Stripe (`PaymentsService.refund`, #104). */
  public async revokeResults(employee: Employee, payment: CandidatePayment): Promise<void> {
    await this.onResultsRevoked(employee, payment)
  }

  /**
   * Droit ouvert (#104) : chaque exercice complété sans analyse — les exercices
   * du forfait, dont l'analyse n'était pas lancée (`docs/AI_JOBS.md`) — part
   * en analyse IA (un échec remonte : le webhook sera rejoué), puis le
   * particulier est prévenu. La notification est au mieux : son échec est
   * signalé mais ne bloque ni ne fait rejouer les jobs.
   */
  protected async onResultsUnlocked(employee: Employee, _payment: CandidatePayment): Promise<void> {
    const pending = await ExerciseResult.query()
      .where('employeeId', employee.id)
      .where('status', exerciceResultStatusValues.COMPLETED)
      .whereNull('qualitativeAnalysis')
      .orderBy('id', 'asc')
      .select('id')
    for (const result of pending) {
      await this.dispatchAnalysis(result.id)
    }
    await this.notifyBestEffort(() => this.notifications.resultsUnlocked(employee), 'unlock')
  }

  /** Droit retiré (#104, #107) : notification `results_access_revoked`. */
  protected async onResultsRevoked(employee: Employee, _payment: CandidatePayment): Promise<void> {
    await this.notifyBestEffort(() => this.notifications.resultsAccessRevoked(employee), 'revoke')
  }

  private async notifyBestEffort(send: () => Promise<void>, step: string): Promise<void> {
    try {
      await send()
    } catch (error) {
      reportError(error, { tags: { feature: 'entitlements', step: `notify_${step}` } })
    }
  }

  /** Isolé pour être observé en test (le driver `sync` exécuterait le job inline). */
  protected async dispatchAnalysis(exerciseResultId: number): Promise<void> {
    await AnalyzeExerciseQualitativeJob.dispatch({ exerciseResultId }).toQueue(QUEUE_NAMES.ai)
  }
}
