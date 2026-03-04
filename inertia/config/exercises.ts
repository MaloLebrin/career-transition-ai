import { ExerciseType } from '../types';
import { EXERCICE_RESULTS_TYPES } from '../../shared/exercises.js';

/**
 * Slugs utilisés dans les routes Inertia / Adonis pour chaque type d'exercice.
 * Ils doivent rester alignés avec EXERCICE_RESULTS_TYPES côté backend.
 */
export const EXERCISE_SLUGS: Partial<Record<ExerciseType, string>> = {
  [ExerciseType.MOTIVATION]: EXERCICE_RESULTS_TYPES.MOTIVATION,
  [ExerciseType.VALUES]: EXERCICE_RESULTS_TYPES.VALUES,
  [ExerciseType.PERSONALITY]: EXERCICE_RESULTS_TYPES.PERSONALITY,
  [ExerciseType.LIFE_CURVE]: EXERCICE_RESULTS_TYPES.LIFE_CURVE,
  [ExerciseType.TARGETING]: EXERCICE_RESULTS_TYPES.TARGETING,
  [ExerciseType.DISC]: EXERCICE_RESULTS_TYPES.DISC,
  [ExerciseType.SKILL_MAPPING]: EXERCICE_RESULTS_TYPES.SKILL_MAPPING,
  [ExerciseType.CIRCLE_OF_CONTROL]: EXERCICE_RESULTS_TYPES.CIRCLE_OF_CONTROL,
};

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
]);

