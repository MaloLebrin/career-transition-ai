import { EXERCISE_LIST } from '../../shared/constants/exercises.js'
import { ExerciseType } from '../types'

export type { ExerciseListEntry } from '../../shared/constants/exercises.js'
export { EXERCISE_LIST }

/**
 * Slugs utilisés dans les routes Inertia / Adonis pour chaque type d'exercice.
 *
 * CONTRAT AVEC LE BACKEND:
 * - Chaque entrée doit correspondre exactement à un slug défini
 *   dans `shared/exercises.ts` (EXERCICE_RESULTS_TYPES).
 * - Lors de l'ajout d'un nouveau type d'exercice:
 *   1. L'ajouter dans `shared/exercises.ts`.
 *   2. L'ajouter ici dans `EXERCISE_SLUGS`.
 *   3. Mettre à jour, si besoin, la config `EXERCISES_WITH_INERTIA_DRAFT`.
 */
export const EXERCISE_SLUGS: Partial<Record<ExerciseType, string>> = {
  [ExerciseType.MOTIVATION]: ExerciseType.MOTIVATION,
  [ExerciseType.VALUES]: ExerciseType.VALUES,
  [ExerciseType.PERSONALITY]: ExerciseType.PERSONALITY,
  [ExerciseType.LIFE_CURVE]: ExerciseType.LIFE_CURVE,
  [ExerciseType.TARGETING]: ExerciseType.TARGETING,
  [ExerciseType.DISC]: ExerciseType.DISC,
  [ExerciseType.SKILL_MAPPING]: ExerciseType.SKILL_MAPPING,
  [ExerciseType.CIRCLE_OF_CONTROL]: ExerciseType.CIRCLE_OF_CONTROL,
}

/**
 * Types pour lesquels on utilise Inertia pour les brouillons.
 * Par défaut, tous les types configurés ci-dessus.
 */
export const EXERCISES_WITH_INERTIA_DRAFT = new Set<ExerciseType>([
  ExerciseType.MOTIVATION,
  ExerciseType.VALUES,
  ExerciseType.PERSONALITY,
  ExerciseType.LIFE_CURVE,
  ExerciseType.TARGETING,
  ExerciseType.DISC,
  ExerciseType.SKILL_MAPPING,
  ExerciseType.CIRCLE_OF_CONTROL,
])

export const EXERCISE_COLORS: Partial<Record<ExerciseType, { bg: string; text: string; border: string; icon: string }>> = {
  [ExerciseType.MOTIVATION]:       { bg: 'bg-violet-50',  text: 'text-violet-600',  border: 'border-violet-200',  icon: 'bg-violet-100 text-violet-600' },
  [ExerciseType.VALUES]:           { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200',   icon: 'bg-amber-100 text-amber-600'  },
  [ExerciseType.LIFE_CURVE]:       { bg: 'bg-indigo-50',  text: 'text-indigo-600',  border: 'border-indigo-200',  icon: 'bg-indigo-100 text-indigo-600' },
  [ExerciseType.PERSONALITY]:      { bg: 'bg-pink-50',    text: 'text-pink-600',    border: 'border-pink-200',    icon: 'bg-pink-100 text-pink-600'    },
  [ExerciseType.TARGETING]:        { bg: 'bg-cyan-50',    text: 'text-cyan-600',    border: 'border-cyan-200',    icon: 'bg-cyan-100 text-cyan-600'    },
  [ExerciseType.DISC]:             { bg: 'bg-orange-50',  text: 'text-orange-600',  border: 'border-orange-200',  icon: 'bg-orange-100 text-orange-600' },
  [ExerciseType.SKILL_MAPPING]:    { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', icon: 'bg-emerald-100 text-emerald-600' },
  [ExerciseType.CIRCLE_OF_CONTROL]:{ bg: 'bg-teal-50',    text: 'text-teal-600',    border: 'border-teal-200',    icon: 'bg-teal-100 text-teal-600'    },
}
