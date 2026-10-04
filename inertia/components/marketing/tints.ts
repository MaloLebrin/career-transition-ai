/**
 * Teintes expressives des pages marketing (DESIGN.md) : `surface` pour classer (fond pastel),
 * `ink` pour le texte dessus. Classes littérales, pour que Tailwind les détecte.
 */
export const MARKETING_TINTS = {
  sun: { surface: 'bg-tint-sun', ink: 'text-tint-sun-ink' },
  apricot: { surface: 'bg-tint-apricot', ink: 'text-tint-apricot-ink' },
  meadow: { surface: 'bg-tint-meadow', ink: 'text-tint-meadow-ink' },
  lake: { surface: 'bg-tint-lake', ink: 'text-tint-lake-ink' },
  lavender: { surface: 'bg-tint-lavender', ink: 'text-tint-lavender-ink' },
  blossom: { surface: 'bg-tint-blossom', ink: 'text-tint-blossom-ink' },
  sky: { surface: 'bg-tint-sky', ink: 'text-tint-sky-ink' },
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
