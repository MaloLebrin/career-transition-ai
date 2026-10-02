import { EXERCICE_RESULTS_TYPES, type ExerciceResultType } from './exercises.js'

/**
 * Mode B2C (épic #90) : particuliers inscrits seuls, rattachés à l'organisation
 * plateforme, qui paient un forfait pour débloquer leurs résultats.
 */

/** Origine d'une fiche candidat (`employees.account_type`, CHECK SQL). */
export const ACCOUNT_TYPES = {
  /** Candidat invité par un cabinet client (défaut). */
  B2B: 'b2b',
  /** Particulier inscrit seul via `/inscription`. */
  B2C: 'b2c',
} as const

export type AccountType = (typeof ACCOUNT_TYPES)[keyof typeof ACCOUNT_TYPES]

export const accountTypeValues = Object.values(ACCOUNT_TYPES)

/**
 * Exercices gratuits du parcours B2C, affichés en premier : résultats visibles
 * sans paiement. Tout autre exercice est verrouillé tant que le forfait n'est
 * pas réglé.
 */
export const B2C_FREE_EXERCISE_TYPES: readonly ExerciceResultType[] = [
  EXERCICE_RESULTS_TYPES.MOTIVATION,
  EXERCICE_RESULTS_TYPES.VALUES,
]

/**
 * L'analyse IA qualitative des exercices gratuits est offerte, une seule fois
 * par exercice (décision PO à confirmer, question 2 de #90).
 */
export const B2C_FREE_INCLUDES_AI_ANALYSIS = true

/**
 * Motif de verrouillage d'un exercice côté candidat (#100) : le plan
 * d'accompagnement (B2B) ou le forfait non réglé (B2C).
 */
export const EXERCISE_LOCK_REASONS = {
  PLAN: 'plan',
  PAYMENT: 'payment',
} as const

export type ExerciseLockReason = (typeof EXERCISE_LOCK_REASONS)[keyof typeof EXERCISE_LOCK_REASONS]

export const exerciseLockReasonValues = Object.values(EXERCISE_LOCK_REASONS)

/** Page de l'offre (forfait) vers laquelle pointent les CTA « Débloquer » (#102). */
export const B2C_OFFER_PATH = '/dashboard/candidat/offre'
