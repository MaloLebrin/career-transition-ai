/**
 * Géométrie de la frise « courbe de vie » : un axe horizontal au niveau neutre
 * (5/10), une courbe lissée qui passe par chaque événement, au-dessus de l'axe
 * pour les hauts et au-dessous pour les bas, et un point par événement sur
 * l'axe. L'amplitude se cale sur le plus grand écart au neutre (au moins
 * `LIFE_CURVE_MIN_AMPLITUDE`). Calcul pur, partagé par la page de résultat (SVG)
 * et le PDF de synthèse (`@react-pdf/renderer`) : chacun ne fait que dessiner.
 */
import { LIFE_CURVE_MIN_AMPLITUDE, LIFE_CURVE_SCALE } from '../../constants/life_curve.js'
import { monotonePath } from './monotone_path.js'

export type LifeCurveEvent = { year: number; satisfaction: number; label?: string }

export type LifeCurveTimelineSize = {
  width: number
  height: number
  /** Marge à gauche du premier événement. */
  padLeft: number
  /** Marge à droite du dernier événement (la flèche de l'axe s'y loge). */
  padRight: number
  /** Marge au-dessus de la valeur maximale. */
  padTop: number
  /** Marge sous la valeur minimale (années sous l'axe). */
  padBottom: number
  /** Écart minimal entre deux années écrites du même côté de l'axe. */
  minYearGap: number
}

export type LifeCurveMarker = {
  year: number
  satisfaction: number
  label: string
  /** Position sur l'axe. */
  x: number
  /** Hauteur de la courbe à cet événement. */
  curveY: number
  tone: 'high' | 'low' | 'neutral'
  /** Côté de l'axe où écrire l'année : à l'opposé de la courbe, pour ne pas la masquer. */
  labelSide: 'above' | 'below'
  /** L'année s'affiche (pas de chevauchement avec sa voisine du même côté). */
  showYear: boolean
}

export type LifeCurveTimeline = {
  axisY: number
  /** Extrémités de l'axe (la flèche part de `axisEndX`). */
  axisStartX: number
  axisEndX: number
  /** Pointe de flèche de l'axe (triangle fermé). */
  arrowPath: string
  curvePath: string
  /** Surface entre la courbe et l'axe, à découper en haut (hauts) et en bas (bas). */
  areaPath: string
  /** Rectangles de découpe : au-dessus de l'axe, au-dessous de l'axe. */
  highClip: { x: number; y: number; width: number; height: number }
  lowClip: { x: number; y: number; width: number; height: number }
  markers: LifeCurveMarker[]
}

/** Événements valides (année et satisfaction numériques), triés, un par année. */
export function normalizeLifeCurveEvents(raw: unknown): LifeCurveEvent[] {
  if (!Array.isArray(raw)) return []
  const valid = raw
    .filter(
      (p): p is LifeCurveEvent => Number.isFinite(p?.year) && Number.isFinite(p?.satisfaction)
    )
    .map((p) => ({
      year: p.year,
      satisfaction: Math.min(LIFE_CURVE_SCALE.MAX, Math.max(LIFE_CURVE_SCALE.MIN, p.satisfaction)),
      label: typeof p.label === 'string' ? p.label.trim() : '',
    }))
    .sort((a, b) => a.year - b.year)
  // Deux saisies pour la même année : la dernière l'emporte (la courbe reste une fonction)
  return [...new Map(valid.map((p) => [p.year, p])).values()]
}

function toneOf(satisfaction: number): LifeCurveMarker['tone'] {
  if (satisfaction > LIFE_CURVE_SCALE.NEUTRAL) return 'high'
  if (satisfaction < LIFE_CURVE_SCALE.NEUTRAL) return 'low'
  return 'neutral'
}

/**
 * Choisit les années à écrire, de gauche à droite et côté par côté : une année
 * s'affiche si elle est assez loin de la dernière écrite du même côté. La
 * dernière année s'affiche toujours, quitte à masquer sa voisine trop proche.
 * Les événements peuvent être irréguliers (2000, puis 2018 à 2024) : l'écart se
 * mesure entre voisins, jamais sur la première paire.
 */
export function withYearLabels(markers: LifeCurveMarker[], minGap: number): LifeCurveMarker[] {
  const shown = markers.map(() => false)
  const lastShown: Record<LifeCurveMarker['labelSide'], number | null> = {
    above: null,
    below: null,
  }
  markers.forEach((m, i) => {
    const previous = lastShown[m.labelSide]
    if (previous === null || m.x - markers[previous].x >= minGap) {
      shown[i] = true
      lastShown[m.labelSide] = i
    }
  })

  const lastIndex = markers.length - 1
  if (lastIndex >= 0 && !shown[lastIndex]) {
    const side = markers[lastIndex].labelSide
    const previous = lastShown[side]
    if (previous !== null) shown[previous] = false
    shown[lastIndex] = true
  }
  return markers.map((m, i) => ({ ...m, showYear: shown[i] }))
}

export function buildLifeCurveTimeline(
  events: LifeCurveEvent[],
  size: LifeCurveTimelineSize
): LifeCurveTimeline | null {
  if (events.length < 2) return null
  const { width, height, padLeft, padRight, padTop, padBottom } = size

  const firstYear = events[0].year
  const span = events.at(-1)!.year - firstYear || 1
  const innerWidth = width - padLeft - padRight
  const toX = (year: number) => padLeft + ((year - firstYear) / span) * innerWidth

  // Axe au milieu ; l'amplitude se cale sur le plus grand écart au neutre, pour
  // que les hauts et les bas occupent toute la hauteur (frise, pas graphique gradué).
  const { NEUTRAL } = LIFE_CURVE_SCALE
  const halfHeight = (height - padTop - padBottom) / 2
  const axisY = padTop + halfHeight
  const maxDeviation = Math.max(
    LIFE_CURVE_MIN_AMPLITUDE,
    ...events.map((e) => Math.abs(e.satisfaction - NEUTRAL))
  )
  const toY = (s: number) => axisY - ((s - NEUTRAL) / maxDeviation) * halfHeight

  const curvePoints = events.map((e) => ({ x: toX(e.year), y: toY(e.satisfaction) }))
  const curvePath = monotonePath(curvePoints)
  const firstX = curvePoints[0].x
  const lastX = curvePoints.at(-1)!.x
  const areaPath = `${curvePath}L${lastX},${axisY}L${firstX},${axisY}Z`

  const axisStartX = Math.max(0, padLeft / 3)
  const axisEndX = width - 10
  const arrowPath = `M${axisEndX},${axisY - 5}L${width},${axisY}L${axisEndX},${axisY + 5}Z`

  return {
    axisY,
    axisStartX,
    axisEndX,
    arrowPath,
    curvePath,
    areaPath,
    highClip: { x: 0, y: 0, width, height: axisY },
    lowClip: { x: 0, y: axisY, width, height: height - axisY },
    markers: withYearLabels(
      events.map((e, i) => ({
        year: e.year,
        satisfaction: e.satisfaction,
        label: e.label ?? '',
        x: curvePoints[i].x,
        curveY: curvePoints[i].y,
        tone: toneOf(e.satisfaction),
        labelSide: e.satisfaction < NEUTRAL ? 'above' : 'below',
        showYear: false,
      })),
      size.minYearGap
    ),
  }
}
