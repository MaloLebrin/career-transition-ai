import {
  DISC_WHEEL_RINGS,
  DISC_WHEEL_TRAIT_ANGLES,
  DISC_WHEEL_TRAITS,
  DISC_WHEEL_ZONE_SPAN,
  DISC_WHEEL_ZONES,
  type DiscWheelRing,
  type DiscWheelTrait,
  type DiscWheelZone,
} from '#shared/constants/disc_wheel'

/**
 * Géométrie de la roue DISC, sans dépendance React : utilisée par la roue
 * interactive (`DiscWheel`) et par le PDF de synthèse (react-pdf).
 *
 * Convention : angles en degrés depuis le haut, sens horaire ; repère SVG (y vers le bas).
 */

export type DiscPercentInput = Partial<Record<DiscWheelTrait, unknown>>

export type DiscWheelPosition = {
  /** Angle du point, en degrés [0, 360). 0 quand le profil est parfaitement équilibré. */
  angle: number
  /** Écart brut entre traits opposés, normalisé 0..1. */
  rawIntensity: number
  /**
   * Distance au centre utilisée pour placer le point (0..1). Racine de `rawIntensity` :
   * un écart de 10 points s'éloigne déjà nettement du centre.
   */
  intensity: number
  /** Zone vers laquelle penche le profil ; `null` si les scores sont parfaitement équilibrés. */
  zone: DiscWheelZone | null
  ring: DiscWheelRing
}

export type Point = { x: number; y: number }

function clampPercent(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, n))
}

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360
}

export function polarToXY(cx: number, cy: number, radius: number, angleDeg: number): Point {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + radius * Math.sin(rad), y: cy - radius * Math.cos(rad) }
}

/** Zone qui contient un angle donné. */
export function discWheelZoneAt(angle: number): DiscWheelZone {
  const index = Math.round(normalizeAngle(angle) / DISC_WHEEL_ZONE_SPAN) % DISC_WHEEL_ZONES.length
  return DISC_WHEEL_ZONES[index]
}

/** Anneau qui contient une intensité (0..1). */
export function discWheelRingAt(intensity: number): DiscWheelRing {
  const value = Math.max(0, Math.min(1, intensity))
  return (
    DISC_WHEEL_RINGS.find((ring) => value >= ring.from && value < ring.to) ??
    DISC_WHEEL_RINGS[DISC_WHEEL_RINGS.length - 1]
  )
}

/**
 * Place le candidat sur la roue : somme des vecteurs des quatre traits pondérés
 * par leur score. D s'oppose à S et I à C, donc seul l'écart entre traits opposés compte.
 */
export function discWheelPosition(percent: DiscPercentInput): DiscWheelPosition {
  const vector = DISC_WHEEL_TRAITS.reduce<Point>(
    (acc, trait) => {
      const unit = polarToXY(0, 0, 1, DISC_WHEEL_TRAIT_ANGLES[trait])
      const weight = clampPercent(percent[trait]) / 100
      return { x: acc.x + unit.x * weight, y: acc.y + unit.y * weight }
    },
    { x: 0, y: 0 }
  )

  const magnitude = Math.hypot(vector.x, vector.y)
  const rawIntensity = Math.min(1, magnitude)
  const intensity = Math.sqrt(rawIntensity)

  if (magnitude < 1e-6) {
    return { angle: 0, rawIntensity: 0, intensity: 0, zone: null, ring: DISC_WHEEL_RINGS[0] }
  }

  const angle = normalizeAngle((Math.atan2(vector.x, -vector.y) * 180) / Math.PI)
  return {
    angle,
    rawIntensity,
    intensity,
    zone: discWheelZoneAt(angle),
    ring: discWheelRingAt(intensity),
  }
}

/** Point du candidat en coordonnées SVG, pour une roue de centre (cx, cy) et de rayon `radius`. */
export function discWheelPoint(
  position: DiscWheelPosition,
  cx: number,
  cy: number,
  radius: number
): Point {
  return polarToXY(cx, cy, position.intensity * radius, position.angle)
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Chemin SVG d'un secteur d'anneau entre les rayons `innerRadius` et `outerRadius`,
 * de l'angle `startAngle` à `endAngle` (sens horaire). `innerRadius = 0` donne une part de disque.
 */
export function sectorPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const sweep = endAngle - startAngle
  const largeArc = sweep > 180 ? 1 : 0
  const outerStart = polarToXY(cx, cy, outerRadius, startAngle)
  const outerEnd = polarToXY(cx, cy, outerRadius, endAngle)
  const parts = [
    `M ${round(outerStart.x)} ${round(outerStart.y)}`,
    `A ${round(outerRadius)} ${round(outerRadius)} 0 ${largeArc} 1 ${round(outerEnd.x)} ${round(outerEnd.y)}`,
  ]
  if (innerRadius > 0) {
    const innerEnd = polarToXY(cx, cy, innerRadius, endAngle)
    const innerStart = polarToXY(cx, cy, innerRadius, startAngle)
    parts.push(
      `L ${round(innerEnd.x)} ${round(innerEnd.y)}`,
      `A ${round(innerRadius)} ${round(innerRadius)} 0 ${largeArc} 0 ${round(innerStart.x)} ${round(innerStart.y)}`
    )
  } else {
    parts.push(`L ${round(cx)} ${round(cy)}`)
  }
  parts.push('Z')
  return parts.join(' ')
}

/** Bornes angulaires d'une zone. */
export function discWheelZoneBounds(zone: DiscWheelZone): { start: number; end: number } {
  return {
    start: zone.angle - DISC_WHEEL_ZONE_SPAN / 2,
    end: zone.angle + DISC_WHEEL_ZONE_SPAN / 2,
  }
}

/** Écart minimal (en points) affiché par le radar, pour ne pas grossir un écart insignifiant. */
export const DISC_RADAR_MIN_SPAN = 30

/**
 * Domaine radial du radar resserré autour des scores, pour accentuer les nuances
 * (les scores DISC restent souvent entre 30 et 70 %). Bornes multiples de 10,
 * dans [0, 100], écart d'au moins `DISC_RADAR_MIN_SPAN` points.
 */
export function discRadarDomain(percent: DiscPercentInput): [number, number] {
  const values = DISC_WHEEL_TRAITS.map((trait) => clampPercent(percent[trait]))
  let low = Math.max(0, Math.floor((Math.min(...values) - 10) / 10) * 10)
  let high = Math.min(100, Math.ceil((Math.max(...values) + 5) / 10) * 10)

  if (high - low < DISC_RADAR_MIN_SPAN) {
    const missing = DISC_RADAR_MIN_SPAN - (high - low)
    const down = Math.min(low, Math.ceil(missing / 20) * 10)
    low -= down
    high = Math.min(100, high + (DISC_RADAR_MIN_SPAN - (high - low)))
    if (high - low < DISC_RADAR_MIN_SPAN) low = Math.max(0, high - DISC_RADAR_MIN_SPAN)
  }

  return [low, high]
}

/** Graduations du radar : bornes du domaine et paliers intermédiaires de 10 ou 20 points. */
export function discRadarTicks([low, high]: [number, number]): number[] {
  const step = high - low > 50 ? 20 : 10
  const count = Math.floor((high - low) / step)
  return Array.from({ length: count + 1 }, (_, index) => low + index * step).concat(
    (high - low) % step === 0 ? [] : [high]
  )
}

/** Position d'un score dans le domaine du radar, 0..1. */
export function discRadarRatio(value: unknown, [low, high]: [number, number]): number {
  if (high <= low) return 0
  return Math.max(0, Math.min(1, (clampPercent(value) - low) / (high - low)))
}
