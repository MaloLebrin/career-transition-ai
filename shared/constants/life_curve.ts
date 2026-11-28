/**
 * Courbe de vie : échelle de satisfaction et libellés des questions de réflexion
 * (exercice `life_curve`). Partagé par la page de résultat et le PDF de synthèse.
 */

/** Échelle de satisfaction saisie par le candidat (curseur de l'exercice). */
export const LIFE_CURVE_SCALE = { MIN: 0, MAX: 10, NEUTRAL: 5 } as const

/** Clés des réponses de réflexion, dans l'ordre des questions de l'exercice. */
export const LIFE_CURVE_REFLECTION_KEYS = [
  'form',
  'mostlySatisfied',
  'amplitude',
  'explanation',
  'surprise',
  'coherence',
] as const

export type LifeCurveReflectionKey = (typeof LIFE_CURVE_REFLECTION_KEYS)[number]

/** Intitulé court de chaque question de réflexion (titre de carte, PDF). */
export const LIFE_CURVE_REFLECTION_LABELS: Record<LifeCurveReflectionKey, string> = {
  form: 'Forme de la courbe',
  mostlySatisfied: 'Plutôt satisfaisante ?',
  amplitude: 'Amplitude',
  explanation: 'Explication du relief',
  surprise: 'Surprise',
  coherence: 'Cohérence avec le parcours',
}
