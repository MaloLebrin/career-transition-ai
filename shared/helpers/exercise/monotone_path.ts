/**
 * Tracé SVG lissé d'une série de points (courbe de vie du PDF de synthèse).
 *
 * Interpolation cubique monotone en x (Fritsch–Carlson, même algorithme que
 * `curveMonotoneX` de d3, utilisé par recharts `type="monotone"` sur la page
 * web) : la courbe passe par chaque point, ne dépasse jamais un sommet ni un
 * creux, et reste donc lisible sur une échelle bornée (0 à 10).
 */
export type PathPoint = { x: number; y: number }

const sign = (v: number) => (v < 0 ? -1 : 1)

/** Pente d'un point intérieur, à partir des deux segments qui l'entourent. */
function interiorTangent(p0: PathPoint, p1: PathPoint, p2: PathPoint): number {
  const h0 = p1.x - p0.x
  const h1 = p2.x - p1.x
  const s0 = (p1.y - p0.y) / h0
  const s1 = (p2.y - p1.y) / h1
  const p = (s0 * h1 + s1 * h0) / (h0 + h1)
  const t = (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p))
  // Deux années identiques (division par zéro) : tangente plate
  return Number.isFinite(t) ? t : 0
}

/** Pente d'une extrémité, déduite de la pente voisine. */
function endTangent(p0: PathPoint, p1: PathPoint, neighbour: number): number {
  const h = p1.x - p0.x
  return h ? (3 * (p1.y - p0.y)) / h / 2 - neighbour / 2 : neighbour
}

const fmt = (v: number) => String(Math.round(v * 100) / 100)

export function monotonePath(points: PathPoint[]): string {
  if (points.length === 0) return ''
  const [first] = points
  if (points.length === 1) return `M${fmt(first.x)},${fmt(first.y)}`
  if (points.length === 2) {
    return `M${fmt(first.x)},${fmt(first.y)}L${fmt(points[1].x)},${fmt(points[1].y)}`
  }

  const last = points.length - 1
  const inner = points.slice(1, last).map((p, i) => interiorTangent(points[i], p, points[i + 2]))
  const tangents = [
    endTangent(points[0], points[1], inner[0]),
    ...inner,
    endTangent(points[last - 1], points[last], inner.at(-1)!),
  ]

  const segments = points.slice(1).map((p1, i) => {
    const p0 = points[i]
    const dx = (p1.x - p0.x) / 3
    return (
      `C${fmt(p0.x + dx)},${fmt(p0.y + dx * tangents[i])} ` +
      `${fmt(p1.x - dx)},${fmt(p1.y - dx * tangents[i + 1])} ` +
      `${fmt(p1.x)},${fmt(p1.y)}`
    )
  })
  return `M${fmt(first.x)},${fmt(first.y)}${segments.join('')}`
}
