/**
 * Géométrie fixe du logo jumpUjob (brief développeur, planche 25 « galet sur plongeoir »).
 * Ne jamais redessiner ni étirer le galet : toute variante réutilise ces tracés.
 * Mêmes tracés dans `public/logo.svg`, `public/logo-dark.svg` et `public/favicon.svg`.
 */

/** Le galet, viewBox 240 × 220. Sert aussi de `clip-path` aux portraits. */
export const GALET_PATH =
  'M 128 6 C 196 2, 236 44, 232 104 C 228 170, 186 214, 112 216 C 46 218, 6 172, 8 110 C 10 46, 60 10, 128 6 Z'
export const GALET_VIEWBOX = { width: 240, height: 220 } as const

/**
 * Cadre de la marque complète (galet + plongeoir). Commence à y = −32 : tourné de −12°, le
 * galet dépasse le haut de sa boîte d'environ 30 px.
 */
export const MARK_VIEWBOX = { minY: -32, width: 340, height: 292 } as const

/** Plongeoir : la planche qui plie sous le galet, puis son pied. */
export const BOARD_PATH = 'M 20 226 C 90 226, 150 224, 200 206'
export const BOARD_FOOT = { x: 12, y: 214, width: 26, height: 40, rx: 8 } as const

/**
 * Le galet est posé dans une boîte 200 × 183 à (120, 0), tourné de −12° autour de son coin
 * bas gauche (20 % de la largeur, 100 % de la hauteur).
 */
export const GALET_TRANSFORM = 'translate(120 0) rotate(-12 40 183)'
export const GALET_SCALE = 200 / GALET_VIEWBOX.width

/**
 * Monogramme « jUj » tracé (indépendant de la police : les j sans point, U+0237, manquent
 * à beaucoup de polices de secours). Coordonnées dans la boîte 200 × 183 du galet.
 */
export const MONOGRAM = {
  strokeWidth: 15,
  leftJ: 'M 58 81.5 V 120 Q 58 134 44 134',
  u: 'M 80 62 V 91 A 18 18 0 0 0 116 91 V 62',
  rightJ: 'M 137 81.5 V 120 Q 137 134 123 134',
  /** Les deux points des j, posés dans le U : le visage. */
  eyes: [
    { cx: 92, cy: 71 },
    { cx: 104, cy: 71 },
  ],
  eyeRadius: 5.5,
} as const

/** Pastille ronde des petites tailles (≤ 32 px) : cercle jaune, U seul. viewBox 32 × 32. */
export const BADGE_U_PATH = 'M 10.5 9.5 V 17 A 5.5 5.5 0 0 0 21.5 17 V 9.5'
export const BADGE_U_STROKE = 4.5
