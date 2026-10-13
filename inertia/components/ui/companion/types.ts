export type CompanionPose = 'wave' | 'cheer' | 'think' | 'guard' | 'rest'
export type CompanionSize = 'sm' | 'md' | 'lg' | 'xl'
export type CompanionTone = 'default' | 'inverse'

/** Rôles de couleur du droïde, résolus en `var(--color-*)` selon le ton. */
export interface CompanionPalette {
  /** Bande sombre du dôme et lentille principale : toujours encre. */
  line: string
  /** Contours et antennes : encre sur surface claire, `on-ink` sur ink. */
  stroke: string
  /** Coque blanche de la sphère et du dôme. */
  shell: string
  /** Reflets. */
  highlight: string
  /** Panneaux orange de la sphère et du dôme. */
  panel: string
  /** Pièces grises : antennes, charnières, ombre au sol. */
  metal: string
  /** Petite lentille secondaire. */
  lens: string
  /** Pousse de l'état de repos. */
  leaf: string
  /** Cadenas de l'état verrouillé. */
  lock: string
}

export type EyeKind = 'open' | 'happy' | 'squint' | 'up'
