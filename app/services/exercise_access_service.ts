import type Employee from '#models/employee'
import SupportPlanStepExercise from '#models/support_plan_step_exercise'
import { EntitlementsService } from '#services/entitlements_service'
import { ACCOUNT_TYPES, EXERCISE_LOCK_REASONS } from '#shared/constants/b2c'
import { EXERCISE_LIST, type ExerciceResultType } from '#shared/constants/exercises'
import { canAccessExerciseB2c, shouldRunAiAnalysisB2c } from '#shared/helpers/b2c_access'
import { canAccessExercise } from '#shared/helpers/exercise_access'
import type { ExerciseAccess } from '#shared/types/exercise/access'
import { inject } from '@adonisjs/core'

/**
 * Accès d'un candidat à ses exercices (#100).
 *
 * - B2B : un exercice est accessible s'il est rattaché à au moins une étape
 *   **non verrouillée** du plan d'accompagnement (règle historique, déplacée
 *   depuis `ExerciseResultsService`).
 * - B2C : exercices gratuits (`B2C_FREE_EXERCISE_TYPES`) tant que le forfait
 *   n'est pas réglé, tout le catalogue ensuite (`EntitlementsService`).
 *
 * Les contrôleurs candidat passent par `resolve()` / `canAccess()` ; le
 * résultat est aussi partagé aux pages Inertia (prop `exerciseAccess`).
 */
@inject()
export class ExerciseAccessService {
  constructor(private entitlements: EntitlementsService) {}

  public async resolve(employee: Employee): Promise<ExerciseAccess> {
    if (employee.accountType === ACCOUNT_TYPES.B2C) {
      return this.resolveB2c(employee)
    }
    return {
      accountType: employee.accountType,
      unlockedExerciseSlugs: await this.unlockedByPlan(employee.id),
      lockedReason: EXERCISE_LOCK_REASONS.PLAN,
      hasPaidAccess: true,
      freeExerciseTypes: [],
      paymentsEnabled: false,
    }
  }

  public async canAccess(employee: Employee, type: ExerciceResultType): Promise<boolean> {
    return canAccessExercise(await this.resolve(employee), type)
  }

  /**
   * Politique d'analyse IA d'un résultat complété : B2B inchangé (toujours) ;
   * B2C payé → toujours ; exercice gratuit → une seule fois ; verrouillé → jamais.
   */
  public async shouldRunAiAnalysis(
    employee: Employee,
    type: ExerciceResultType,
    hasExistingAnalysis: boolean
  ): Promise<boolean> {
    if (employee.accountType !== ACCOUNT_TYPES.B2C) return true
    const entitlement = await this.entitlements.forEmployee(employee)
    return shouldRunAiAnalysisB2c(type, entitlement, hasExistingAnalysis)
  }

  private async resolveB2c(employee: Employee): Promise<ExerciseAccess> {
    const entitlement = await this.entitlements.forEmployee(employee)
    const catalogue = EXERCISE_LIST.map((entry) => entry.slug as ExerciceResultType)
    return {
      accountType: ACCOUNT_TYPES.B2C,
      unlockedExerciseSlugs: catalogue.filter((type) => canAccessExerciseB2c(type, entitlement)),
      lockedReason: EXERCISE_LOCK_REASONS.PAYMENT,
      hasPaidAccess: entitlement.hasPaidAccess,
      freeExerciseTypes: entitlement.freeExerciseTypes,
      paymentsEnabled: entitlement.paymentsEnabled,
    }
  }

  private async unlockedByPlan(employeeId: number): Promise<ExerciceResultType[]> {
    const rows = await SupportPlanStepExercise.query()
      .whereHas('supportPlanStep', (query) => {
        query.where('employeeId', employeeId).where('isLocked', false)
      })
      .select('exerciseType')

    return Array.from(new Set(rows.map((row) => row.exerciseType)))
  }
}
