/**
 * Courbe de vie : échelle de satisfaction et libellés des questions de réflexion
 * (exercice `life_curve`). Partagé par la page de résultat et le PDF de synthèse.
 */

/** Échelle de satisfaction saisie par le candidat (curseur de l'exercice). */
export const LIFE_CURVE_SCALE = { MIN: 0, MAX: 10, NEUTRAL: 5 } as const

/**
 * Écart au neutre qui remplit toute la hauteur de la frise, au minimum : une
 * courbe qui oscille entre 6 et 7 reste modeste au lieu d'être étirée comme un
 * parcours de 0 à 10. Au-delà, l'amplitude se cale sur le plus grand écart.
 */
export const LIFE_CURVE_MIN_AMPLITUDE = 3

/** Textes de la frise, partagés par la page de résultat et le PDF de synthèse. */
export const LIFE_CURVE_TEXTS = {
  LEGEND_HIGH: `Hauts : au-dessus de ${LIFE_CURVE_SCALE.NEUTRAL}/${LIFE_CURVE_SCALE.MAX}`,
  LEGEND_LOW: `Bas : au-dessous de ${LIFE_CURVE_SCALE.NEUTRAL}/${LIFE_CURVE_SCALE.MAX}`,
  UNLABELED_EVENT: 'Sans libellé',
} as const

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
