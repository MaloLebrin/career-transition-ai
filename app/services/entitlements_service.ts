import billingConfig from '#config/billing'
import { EntitlementAlreadyGrantedError, PaymentNotFoundError } from '#exceptions/billing_errors'
import AnalyzeExerciseQualitativeJob from '#jobs/analyze_exercise_qualitative_job'
import CandidatePayment from '#models/candidate_payment'
import Employee from '#models/employee'
import ExerciseResult from '#models/exercise_result'
import type User from '#models/user'
import { CandidateNotificationsService } from '#services/candidate_notifications_service'
import { NotificationService } from '#services/notification_service'
import { ACCOUNT_TYPES, B2C_FREE_EXERCISE_TYPES } from '#shared/constants/b2c'
import {
  BILLING_CURRENCY,
  PAYMENT_PRODUCTS,
  PAYMENT_PROVIDERS,
  PAYMENT_STATUSES,
} from '#shared/constants/billing'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import type { ResultsEntitlement } from '#shared/types/billing/entitlement'
import { exerciceResultStatusValues } from '#shared/constants/exercises'
import type { RevokeEntitlementInput } from '#shared/types/billing/inputs'
import { QUEUE_NAMES } from '#utils/queues/queue_names'
import { DateTime } from 'luxon'

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
 */
export class EntitlementsService {
  constructor(
    private notifications: CandidateNotificationsService = new CandidateNotificationsService(
      new NotificationService()
    )
  ) {}

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

  /** Ids (parmi `employeeIds`) dont le droit est ouvert, en une seule requête. */
  public async employeeIdsWithResultsAccess(employeeIds: number[]): Promise<Set<number>> {
    if (employeeIds.length === 0) return new Set()
    const rows = await CandidatePayment.query()
      .whereIn('employeeId', employeeIds)
      .where('status', PAYMENT_STATUSES.PAID)
      .whereNull('revokedAt')
      .distinct('employeeId')
      .select('employeeId')
    return new Set(rows.flatMap((row) => (row.employeeId === null ? [] : [row.employeeId])))
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
   * en analyse IA, puis le particulier est prévenu.
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
    await this.notifications.resultsUnlocked(employee)
  }

  /** Droit retiré (#104, #107) : notification `results_access_revoked`. */
  protected async onResultsRevoked(employee: Employee, _payment: CandidatePayment): Promise<void> {
    await this.notifications.resultsAccessRevoked(employee)
  }

  /** Isolé pour être observé en test (le driver `sync` exécuterait le job inline). */
  protected async dispatchAnalysis(exerciseResultId: number): Promise<void> {
    await AnalyzeExerciseQualitativeJob.dispatch({ exerciseResultId }).toQueue(QUEUE_NAMES.ai)
  }
}
