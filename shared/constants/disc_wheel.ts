/**
 * Roue DISC : huit zones de comportement autour des quatre traits D, I, S, C.
 *
 * Les angles se lisent depuis le haut de la roue, dans le sens horaire. Les quatre
 * traits occupent les diagonales (D en haut à droite, I en bas à droite, S en bas à
 * gauche, C en haut à gauche) ; entre deux traits voisins, une zone mixte.
 *
 * Les couleurs reprennent les teintes expressives de la charte (`DESIGN.md` §2) :
 * `tint-x-bold` pour les aplats de la roue (jamais de texte dessus), `tint-x` /
 * `tint-x-ink` pour les badges. Les hex servent au PDF, qui ne lit pas le CSS ;
 * `tests/inertia/constants/disc_wheel.spec.ts` vérifie qu'ils suivent `app.css`.
 */

export const DISC_WHEEL_TRAITS = ['D', 'I', 'S', 'C'] as const
export type DiscWheelTrait = (typeof DISC_WHEEL_TRAITS)[number]

export const DISC_WHEEL_TRAIT_LABELS: Record<DiscWheelTrait, string> = {
  D: 'Dominant',
  I: 'Influent',
  S: 'Stable',
  C: 'Consciencieux',
}

/** Angle (degrés, depuis le haut, sens horaire) du centre de chaque trait pur. */
export const DISC_WHEEL_TRAIT_ANGLES: Record<DiscWheelTrait, number> = {
  D: 45,
  I: 135,
  S: 225,
  C: 315,
}

export type DiscTraitPalette = {
  /** Nom de la teinte de la charte (`tint-<tint>`). */
  tint: 'apricot' | 'sun' | 'lake' | 'sky'
  /** Aplat saturé (hex de `--color-tint-<tint>-bold`). */
  boldHex: string
  /** Fond pastel (hex de `--color-tint-<tint>`). */
  softHex: string
  /** Texte lisible sur le fond pastel (hex de `--color-tint-<tint>-ink`). */
  inkHex: string
  /** Classes Tailwind (littérales, pour que Tailwind les génère). */
  fillClass: string
  barClass: string
  softBgClass: string
  textClass: string
  ringClass: string
}

export const DISC_TRAIT_PALETTE: Record<DiscWheelTrait, DiscTraitPalette> = {
  D: {
    tint: 'apricot',
    boldHex: '#ff5a36',
    softHex: '#ffd9cc',
    inkHex: '#7a2e12',
    fillClass: 'fill-tint-apricot-bold',
    barClass: 'bg-tint-apricot-bold',
    softBgClass: 'bg-tint-apricot',
    textClass: 'text-tint-apricot-ink',
    ringClass: 'ring-tint-apricot-bold',
  },
  I: {
    tint: 'sun',
    boldHex: '#ffc53d',
    softHex: '#ffe08a',
    inkHex: '#8a5a00',
    fillClass: 'fill-tint-sun-bold',
    barClass: 'bg-tint-sun-bold',
    softBgClass: 'bg-tint-sun',
    textClass: 'text-tint-sun-ink',
    ringClass: 'ring-tint-sun-bold',
  },
  S: {
    tint: 'lake',
    boldHex: '#2fbf8a',
    softHex: '#b9f0d6',
    inkHex: '#0b6b4a',
    fillClass: 'fill-tint-lake-bold',
    barClass: 'bg-tint-lake-bold',
    softBgClass: 'bg-tint-lake',
    textClass: 'text-tint-lake-ink',
    ringClass: 'ring-tint-lake-bold',
  },
  C: {
    tint: 'sky',
    boldHex: '#5aaeff',
    softHex: '#cde8ff',
    inkHex: '#174a8a',
    fillClass: 'fill-tint-sky-bold',
    barClass: 'bg-tint-sky-bold',
    softBgClass: 'bg-tint-sky',
    textClass: 'text-tint-sky-ink',
    ringClass: 'ring-tint-sky-bold',
  },
}

export const DISC_WHEEL_ZONE_KEYS = {
  ORGANISANT: 'organisant',
  DIRECTIF: 'directif',
  PROMOTEUR: 'promoteur',
  EXPANSIF: 'expansif',
  FACILITANT: 'facilitant',
  COOPERATIF: 'cooperatif',
  COORDONNANT: 'coordonnant',
  CONSCIENCIEUX: 'consciencieux',
} as const
export type DiscWheelZoneKey = (typeof DISC_WHEEL_ZONE_KEYS)[keyof typeof DISC_WHEEL_ZONE_KEYS]

export type DiscWheelZone = {
  key: DiscWheelZoneKey
  label: string
  /** Centre de la zone, en degrés depuis le haut, sens horaire. */
  angle: number
  /** Un trait pour une zone pure, deux (dans le sens horaire) pour une zone mixte. */
  traits: readonly [DiscWheelTrait] | readonly [DiscWheelTrait, DiscWheelTrait]
  description: string
  keywords: readonly [string, string, string]
}

/** Largeur angulaire d'une zone (8 zones). */
export const DISC_WHEEL_ZONE_SPAN = 45

export const DISC_WHEEL_ZONES: readonly DiscWheelZone[] = [
  {
    key: DISC_WHEEL_ZONE_KEYS.ORGANISANT,
    label: 'Organisant',
    angle: 0,
    traits: ['C', 'D'],
    description:
      'Structure le travail pour atteindre l’objectif : analyse le problème, planifie et fait avancer avec méthode.',
    keywords: ['Planification', 'Résolution de problèmes', 'Efficacité'],
  },
  {
    key: DISC_WHEEL_ZONE_KEYS.DIRECTIF,
    label: 'Directif',
    angle: 45,
    traits: ['D'],
    description:
      'Fixe le cap et tranche vite. Aime les défis, prend les responsabilités et attend des résultats concrets.',
    keywords: ['Décision', 'Résultats', 'Défi'],
  },
  {
    key: DISC_WHEEL_ZONE_KEYS.PROMOTEUR,
    label: 'Promoteur',
    angle: 90,
    traits: ['D', 'I'],
    description:
      'Lance des projets et entraîne les autres avec conviction. Porte le changement et sait convaincre.',
    keywords: ['Initiative', 'Persuasion', 'Changement'],
  },
  {
    key: DISC_WHEEL_ZONE_KEYS.EXPANSIF,
    label: 'Expansif',
    angle: 135,
    traits: ['I'],
    description:
      'Va vers les autres avec enthousiasme. Partage ses idées, crée du lien et apporte de l’énergie au groupe.',
    keywords: ['Relationnel', 'Optimisme', 'Créativité'],
  },
  {
    key: DISC_WHEEL_ZONE_KEYS.FACILITANT,
    label: 'Facilitant',
    angle: 180,
    traits: ['I', 'S'],
    description:
      'Fait travailler les gens ensemble. Écoute, encourage et soigne l’ambiance de l’équipe.',
    keywords: ['Écoute', 'Soutien', 'Esprit d’équipe'],
  },
  {
    key: DISC_WHEEL_ZONE_KEYS.COOPERATIF,
    label: 'Coopératif',
    angle: 225,
    traits: ['S'],
    description:
      'Recherche un cadre stable et harmonieux. Fiable et patient, avance à un rythme régulier avec le collectif.',
    keywords: ['Fiabilité', 'Patience', 'Harmonie'],
  },
  {
    key: DISC_WHEEL_ZONE_KEYS.COORDONNANT,
    label: 'Coordonnant',
    angle: 270,
    traits: ['S', 'C'],
    description:
      'Fait le lien entre les personnes et les tâches avec diplomatie. Suit les dossiers avec précision.',
    keywords: ['Diplomatie', 'Suivi', 'Précision'],
  },
  {
    key: DISC_WHEEL_ZONE_KEYS.CONSCIENCIEUX,
    label: 'Consciencieux',
    angle: 315,
    traits: ['C'],
    description:
      'S’appuie sur les faits, les règles et la qualité. Prend des décisions réfléchies et fiables.',
    keywords: ['Rigueur', 'Analyse', 'Qualité'],
  },
] as const

export const DISC_WHEEL_RING_KEYS = {
  BALANCED: 'balanced',
  NUANCED: 'nuanced',
  ASSERTED: 'asserted',
  MARKED: 'marked',
} as const
export type DiscWheelRingKey = (typeof DISC_WHEEL_RING_KEYS)[keyof typeof DISC_WHEEL_RING_KEYS]

export type DiscWheelRing = {
  key: DiscWheelRingKey
  label: string
  /** Bornes d'intensité (0 = centre, 1 = bord de la roue), exclusive en haut sauf la dernière. */
  from: number
  to: number
}

/** Le disque central et trois anneaux, du centre vers le bord. */
export const DISC_WHEEL_RINGS: readonly DiscWheelRing[] = [
  { key: DISC_WHEEL_RING_KEYS.BALANCED, label: 'équilibrée', from: 0, to: 0.2 },
  { key: DISC_WHEEL_RING_KEYS.NUANCED, label: 'nuancée', from: 0.2, to: 0.47 },
  { key: DISC_WHEEL_RING_KEYS.ASSERTED, label: 'affirmée', from: 0.47, to: 0.74 },
  { key: DISC_WHEEL_RING_KEYS.MARKED, label: 'marquée', from: 0.74, to: 1 },
] as const
