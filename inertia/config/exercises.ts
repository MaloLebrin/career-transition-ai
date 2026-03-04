import { ExerciseType } from '../types';

/**
 * Slugs utilisés dans les routes Inertia / Adonis pour chaque type d'exercice.
 * Ils doivent rester alignés avec EXERCICE_RESULTS_TYPES côté backend.
 */
export const EXERCISE_SLUGS: Partial<Record<ExerciseType, string>> = {
  [ExerciseType.MOTIVATION]: 'motivation',
  [ExerciseType.VALUES]: 'values',
  [ExerciseType.PERSONALITY]: 'personality',
  [ExerciseType.LIFE_CURVE]: 'life_curve',
  [ExerciseType.TARGETING]: 'targeting',
  [ExerciseType.DISC]: 'disc',
  [ExerciseType.SKILL_MAPPING]: 'skill_mapping',
  [ExerciseType.CIRCLE_OF_CONTROL]: 'circle_of_control',
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

