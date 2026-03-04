/**
 * Configuration partagée des types et statuts d'exercices.
 *
 * IMPORTANT:
 * - Toute nouvelle valeur ajoutée ici doit rester synchronisée
 *   avec le frontend (Inertia) via `inertia/config/exercises.ts`.
 * - Les slugs définis ici sont utilisés:
 *   - côté backend pour persister les résultats (Lucid),
 *   - côté frontend pour construire les routes Inertia
 *     (voir `EXERCISE_SLUGS`).
 */

export const EXERCICE_RESULTS_TYPES = {
  MOTIVATION: 'motivation',
  VALUES: 'values',
  PERSONALITY: 'personality',
  COMPETENCIES: 'competencies',
  LIFE_CURVE: 'life_curve',
  CV_ANALYSIS: 'cv_analysis',
  TARGETING: 'targeting',
  DISC: 'disc',
  CIRCLE_OF_CONTROL: 'circle_of_control',
  SKILL_MAPPING: 'skill_mapping',
} as const;

export const exerciceResultTypesValues = Object.values(EXERCICE_RESULTS_TYPES);

export type ExerciceResultType =
  (typeof EXERCICE_RESULTS_TYPES)[keyof typeof EXERCICE_RESULTS_TYPES];

export const exerciceResultStatusValues = {
  DRAFT: 'draft',
  COMPLETED: 'completed',
} as const;

export type ExerciceResultStatus =
  (typeof exerciceResultStatusValues)[keyof typeof exerciceResultStatusValues];

export const exerciceResultStatusValuesValues = Object.values(exerciceResultStatusValues);

