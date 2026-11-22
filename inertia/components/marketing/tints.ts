/**
 * Teintes expressives des pages marketing (DESIGN.md) : `surface` pour classer (fond pastel),
 * `ink` pour le texte dessus, `dot` pour la pastille (point) d'une étiquette. Classes littérales, pour que Tailwind les détecte.
 */
export const MARKETING_TINTS = {
  sun: { surface: 'bg-tint-sun', ink: 'text-tint-sun-ink', dot: 'bg-tint-sun-ink' },
  apricot: { surface: 'bg-tint-apricot', ink: 'text-tint-apricot-ink', dot: 'bg-tint-apricot-ink' },
  meadow: { surface: 'bg-tint-meadow', ink: 'text-tint-meadow-ink', dot: 'bg-tint-meadow-ink' },
  lake: { surface: 'bg-tint-lake', ink: 'text-tint-lake-ink', dot: 'bg-tint-lake-ink' },
  lavender: {
    surface: 'bg-tint-lavender',
    ink: 'text-tint-lavender-ink',
    dot: 'bg-tint-lavender-ink',
  },
  blossom: { surface: 'bg-tint-blossom', ink: 'text-tint-blossom-ink', dot: 'bg-tint-blossom-ink' },
  sky: { surface: 'bg-tint-sky', ink: 'text-tint-sky-ink', dot: 'bg-tint-sky-ink' },
} as const

export type MarketingTint = keyof typeof MARKETING_TINTS

/** Ordre de rotation pour une liste de cartes. */
export const MARKETING_TINT_CYCLE: readonly MarketingTint[] = [
  'sun',
  'lake',
  'blossom',
  'lavender',
  'meadow',
  'apricot',
  'sky',
]

/**
 * Les cinq couples fond / point du brief jumpUjob, dans leur ordre de rotation :
 * jaune, menthe, rose, ciel, vert (pastilles d'exercices, numéros d'étapes, tags).
 */
export const BRAND_PASTEL_CYCLE: readonly MarketingTint[] = [
  'sun',
  'lake',
  'blossom',
  'sky',
  'meadow',
]

/** Couple pastel de rang `index` (0 = premier), en tournant sur `BRAND_PASTEL_CYCLE`. */
export function brandPastel(index: number) {
  return MARKETING_TINTS[BRAND_PASTEL_CYCLE[index % BRAND_PASTEL_CYCLE.length]]
}
