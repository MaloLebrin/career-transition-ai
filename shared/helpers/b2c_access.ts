import {
  ACCOUNT_TYPES,
  B2C_FREE_INCLUDES_AI_ANALYSIS,
  type AccountType,
} from '#shared/constants/b2c'
import type { ExerciceResultType, ExerciseListEntry } from '#shared/constants/exercises'
import type { ResultsEntitlement } from '#shared/types/billing/entitlement'

/**
 * Règles d'accès du parcours B2C (épic #90), pures et partagées serveur / front.
 *
 * Elles ne s'appliquent qu'aux comptes `b2c` : pour un B2B, l'accès aux
 * exercices reste gouverné par le plan d'accompagnement
 * (`ExerciseResultsService`). Les services décident, les pages n'affichent.
 */

export function isB2cAccount(accountType: AccountType | null | undefined): boolean {
  return accountType === ACCOUNT_TYPES.B2C
}

function isFreeExercise(type: ExerciceResultType, entitlement: ResultsEntitlement): boolean {
  return entitlement.freeExerciseTypes.includes(type)
}

/** Un B2C peut faire un exercice s'il est gratuit ou si le forfait est réglé. */
export function canAccessExerciseB2c(
  type: ExerciceResultType,
  entitlement: ResultsEntitlement
): boolean {
  return entitlement.hasPaidAccess || isFreeExercise(type, entitlement)
}

/** Les résultats d'un exercice gratuit sont visibles ; les autres exigent le forfait. */
export function canSeeResultsB2c(
  type: ExerciceResultType,
  entitlement: ResultsEntitlement
): boolean {
  return canAccessExerciseB2c(type, entitlement)
}

/** L'analyse IA suit les résultats, sauf si elle est exclue des exercices gratuits. */
export function canSeeAiAnalysisB2c(
  type: ExerciceResultType,
  entitlement: ResultsEntitlement
): boolean {
  if (entitlement.hasPaidAccess) return true
  return B2C_FREE_INCLUDES_AI_ANALYSIS && isFreeExercise(type, entitlement)
}

/**
 * Faut-il lancer (ou relancer) l'analyse IA d'un résultat complété ?
 * Payé : toujours. Gratuit : une seule fois (pas de relance si une analyse
 * existe). Verrouillé : jamais — elle sera lancée au déblocage (#104).
 */
export function shouldRunAiAnalysisB2c(
  type: ExerciceResultType,
  entitlement: ResultsEntitlement,
  hasExistingAnalysis: boolean
): boolean {
  if (entitlement.hasPaidAccess) return true
  if (!canSeeAiAnalysisB2c(type, entitlement)) return false
  return !hasExistingAnalysis
}

/** Exercices gratuits d'abord, puis les autres ; l'ordre de `EXERCISE_LIST` est conservé dans chaque groupe. */
export function orderExercisesForB2c<T extends Pick<ExerciseListEntry, 'slug'>>(
  list: readonly T[],
  freeExerciseTypes: readonly ExerciceResultType[]
): T[] {
  const free = list.filter((entry) => freeExerciseTypes.includes(entry.slug as ExerciceResultType))
  const paid = list.filter((entry) => !freeExerciseTypes.includes(entry.slug as ExerciceResultType))
  return [...free, ...paid]
}

/** Résultat d'exercice tel que sérialisé vers les pages candidat (forme minimale commune). */
export interface RedactableExerciseResult {
  data: Record<string, unknown>
  qualitativeAnalysis?: string | null
  quantitativeScore?: number | null
}

/**
 * Expurge un résultat verrouillé avant envoi au navigateur : les réponses et
 * l'analyse ne quittent jamais le serveur, seul le statut d'avancement reste.
 */
export function redactLockedExercise<T extends RedactableExerciseResult>(
  result: T
): T & { locked: true } {
  return {
    ...result,
    data: {},
    qualitativeAnalysis: null,
    quantitativeScore: 0,
    locked: true,
  }
}
