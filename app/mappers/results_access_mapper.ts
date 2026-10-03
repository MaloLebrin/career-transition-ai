import { ACCOUNT_TYPES } from '#shared/constants/b2c'
import { exerciceResultTypesValues, type ExerciceResultType } from '#shared/constants/exercises'
import { redactLockedExercise } from '#shared/helpers/b2c_access'
import { canSeeExerciseAiAnalysis, canSeeExerciseResults } from '#shared/helpers/exercise_access'
import type { ExerciseAccess } from '#shared/types/exercise/access'

/**
 * Expurgation des résultats d'exercices avant envoi au navigateur (#101).
 *
 * Un particulier B2C qui n'a pas réglé le forfait ne doit recevoir **aucune**
 * donnée payante : ni réponses (`data`), ni score, ni analyse IA. Un flou CSS
 * ne suffirait pas, les props Inertia restent lisibles dans l'onglet réseau.
 * Les B2B ne sont jamais expurgés (`canSeeExerciseResults` vaut `true`).
 *
 * Deux formes de résultat circulent : celle d'`EmployeeTransformer`
 * (`type` en slug, `qualitativeAnalysis: string | null`) et celle de
 * `mapExerciseResult` (`type` en majuscules, `qualitativeAnalysis?: string`).
 * Le type est normalisé en slug pour la décision, jamais réécrit.
 */

/** Forme minimale commune aux deux sérialisations. */
export interface RedactableResult {
  type: string
  data: unknown
  qualitativeAnalysis?: string | null
  quantitativeScore?: number | null
}

export type RedactedResult<T extends RedactableResult> = T & {
  /** Résultat verrouillé : `data` vidé, score à 0, analyse retirée. */
  locked?: true
  /** Résultat visible mais analyse IA réservée au forfait. */
  analysisLocked?: true
}

export function normalizeExerciseType(type: string): ExerciceResultType | null {
  const slug = String(type).toLowerCase()
  return (exerciceResultTypesValues as string[]).includes(slug)
    ? (slug as ExerciceResultType)
    : null
}

export function redactExerciseResult<T extends RedactableResult>(
  result: T,
  access: ExerciseAccess
): RedactedResult<T> {
  // Les B2B ne sont jamais expurgés : leur accès est porté par le cabinet.
  if (access.accountType !== ACCOUNT_TYPES.B2C) return result

  const type = normalizeExerciseType(result.type)
  // Type inconnu : on ne sait pas le classer, il est traité comme payant.
  if (!type || !canSeeExerciseResults(access, type)) {
    const locked = redactLockedExercise({
      ...result,
      data: (result.data ?? {}) as Record<string, unknown>,
    })
    return withoutAnalysis(locked) as RedactedResult<T>
  }
  if (!canSeeExerciseAiAnalysis(access, type)) {
    return { ...withoutAnalysis(result), analysisLocked: true } as RedactedResult<T>
  }
  return result
}

/** Copie sans la clé `qualitativeAnalysis` (ni `null` ni `undefined` : la clé disparaît). */
function withoutAnalysis<T extends RedactableResult>(result: T): Omit<T, 'qualitativeAnalysis'> {
  const copy: Partial<T> = { ...result }
  delete copy.qualitativeAnalysis
  return copy as Omit<T, 'qualitativeAnalysis'>
}

export function redactExerciseResults<T extends RedactableResult>(
  results: readonly T[] | null | undefined,
  access: ExerciseAccess
): Array<RedactedResult<T>> {
  return (results ?? []).map((result) => redactExerciseResult(result, access))
}

/**
 * Payload candidat (`EmployeeTransformer.transform` ou `mapEmployee`) : seuls les
 * `exercises` changent. Générique volontairement ouvert : la sortie du transformer
 * est un type opaque d'AdonisJS.
 */
export function redactEmployeePayload<T>(payload: T, access: ExerciseAccess): T {
  const record = payload as { exercises?: readonly RedactableResult[] | null } | null | undefined
  if (!record || !record.exercises) return payload
  return { ...record, exercises: redactExerciseResults(record.exercises, access) } as T
}
