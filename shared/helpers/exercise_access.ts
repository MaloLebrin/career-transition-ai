import { ACCOUNT_TYPES } from '#shared/constants/b2c'
import type { ExerciceResultType } from '#shared/constants/exercises'
import type { ExerciseAccess } from '#shared/types/exercise/access'
import { canSeeAiAnalysisB2c, canSeeResultsB2c } from '#shared/helpers/b2c_access'

/**
 * Lectures pures d'un `ExerciseAccess` (#100), partagées serveur / front :
 * les contrôleurs décident avec, les pages affichent avec.
 */

export function canAccessExercise(access: ExerciseAccess, type: ExerciceResultType): boolean {
  return access.unlockedExerciseSlugs.includes(type)
}

export function isExerciseLocked(access: ExerciseAccess, type: ExerciceResultType): boolean {
  return !canAccessExercise(access, type)
}

/** Exercice offert à un B2C (jamais pour un B2B : son accès vient du plan). */
export function isFreeExercise(access: ExerciseAccess, type: ExerciceResultType): boolean {
  return access.accountType === ACCOUNT_TYPES.B2C && access.freeExerciseTypes.includes(type)
}

/** B2B : les résultats sont toujours visibles. B2C : gratuit ou forfait réglé. */
export function canSeeExerciseResults(access: ExerciseAccess, type: ExerciceResultType): boolean {
  if (access.accountType !== ACCOUNT_TYPES.B2C) return true
  return canSeeResultsB2c(type, toEntitlement(access))
}

/** B2B : toujours. B2C : suit les résultats, sauf si l'analyse est exclue du gratuit. */
export function canSeeExerciseAiAnalysis(
  access: ExerciseAccess,
  type: ExerciceResultType
): boolean {
  if (access.accountType !== ACCOUNT_TYPES.B2C) return true
  return canSeeAiAnalysisB2c(type, toEntitlement(access))
}

function toEntitlement(access: ExerciseAccess) {
  return {
    accountType: access.accountType,
    hasPaidAccess: access.hasPaidAccess,
    freeExerciseTypes: access.freeExerciseTypes,
    paymentsEnabled: access.paymentsEnabled,
  }
}
