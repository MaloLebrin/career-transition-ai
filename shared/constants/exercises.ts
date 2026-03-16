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
} as const

export const exerciceResultTypesValues = Object.values(EXERCICE_RESULTS_TYPES)

export type ExerciceResultType =
  (typeof EXERCICE_RESULTS_TYPES)[keyof typeof EXERCICE_RESULTS_TYPES]

export const exerciceResultStatusValues = {
  DRAFT: 'draft',
  COMPLETED: 'completed',
} as const

export type ExerciceResultStatus =
  (typeof exerciceResultStatusValues)[keyof typeof exerciceResultStatusValues]

export const exerciceResultStatusValuesValues = Object.values(exerciceResultStatusValues)

export interface ExerciseListEntry {
  slug: string
  title: string
  description: string
}

/** Liste ordonnée des exercices pour la page liste (titres et descriptions). */
export const EXERCISE_LIST: ExerciseListEntry[] = [
  {
    slug: EXERCICE_RESULTS_TYPES.MOTIVATION,
    title: 'Analyse Motivations',
    description: "Comparez vos leviers d'engagement et hiérarchisez ce qui compte pour vous.",
  },
  {
    slug: EXERCICE_RESULTS_TYPES.VALUES,
    title: 'Recherche de Valeurs',
    description:
      'Identifiez vos valeurs fondamentales et leur impact sur vos choix professionnels.',
  },
  {
    slug: EXERCICE_RESULTS_TYPES.LIFE_CURVE,
    title: 'La courbe de vie',
    description: "Tracer l'évolution de votre satisfaction au fil des années.",
  },
  {
    slug: EXERCICE_RESULTS_TYPES.PERSONALITY,
    title: 'Questionnaire Personnalité',
    description:
      'Explorer vos traits de personnalité et leur lien avec votre posture professionnelle.',
  },
  {
    slug: EXERCICE_RESULTS_TYPES.TARGETING,
    title: 'Ciblage Organismes',
    description: "Recherche d'organismes de formation ou d'emploi ciblés.",
  },
  {
    slug: EXERCICE_RESULTS_TYPES.DISC,
    title: 'Diagnostic DISC',
    description:
      'Découvrez votre profil comportemental (Dominance, Influence, Stabilité, Conformité).',
  },
  {
    slug: EXERCICE_RESULTS_TYPES.SKILL_MAPPING,
    title: 'Cartographie des Compétences',
    description: 'Mettez en lumière vos preuves et réalisations par mission et activité.',
  },
  {
    slug: EXERCICE_RESULTS_TYPES.CIRCLE_OF_CONTROL,
    title: 'Cercle de Contrôle',
    description: 'Distinguer ce qui dépend de vous de ce qui ne dépend pas de vous.',
  },
]
