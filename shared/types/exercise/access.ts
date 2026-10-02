import type { AccountType, ExerciseLockReason } from '#shared/constants/b2c'
import type { ExerciceResultType } from '#shared/constants/exercises'

/**
 * Accès d'un candidat à ses exercices (#100), calculé par
 * `ExerciseAccessService` et partagé aux pages Inertia (`exerciseAccess`).
 *
 * - B2B : `unlockedExerciseSlugs` vient du plan d'accompagnement (étapes non
 *   verrouillées), `lockedReason = 'plan'`, résultats et analyses toujours visibles.
 * - B2C : exercices gratuits (`freeExerciseTypes`) ou tous si le forfait est
 *   réglé (`hasPaidAccess`), `lockedReason = 'payment'`.
 *
 * Le front n'en déduit que l'affichage ; les services refusent eux-mêmes
 * toute écriture sur un exercice verrouillé.
 */
export interface ExerciseAccess {
  accountType: AccountType
  unlockedExerciseSlugs: ExerciceResultType[]
  lockedReason: ExerciseLockReason
  /** B2B : toujours `true`. B2C : forfait réglé. */
  hasPaidAccess: boolean
  /** Exercices accessibles sans paiement pour un B2C (vide pour un B2B). */
  freeExerciseTypes: ExerciceResultType[]
  /** `STRIPE_ENABLED` : affiche « Débloquer » ou « Bientôt disponible ». */
  paymentsEnabled: boolean
}

/** Brouillon ou résultat terminé repris dans l'outil d'exercice (`initialDraftsByType`). */
export interface ExerciseInitialDraft {
  employeeId: number
  type: ExerciceResultType
  lastUpdated: string
  data: Record<string, unknown>
}

/** Ce que le contrôleur candidat affiche pour un exercice accessible. */
export interface CandidateExerciseState {
  initialDraft: ExerciseInitialDraft | null
  exerciseProgressPercent: number
}
