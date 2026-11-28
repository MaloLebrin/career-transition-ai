import {
  DISC_TRAIT_PALETTE,
  DISC_WHEEL_RINGS,
  DISC_WHEEL_TRAIT_ANGLES,
  DISC_WHEEL_TRAITS,
  DISC_WHEEL_ZONES,
  type DiscWheelZoneKey,
} from '#shared/constants/disc_wheel'
import { discWheelZoneBounds, polarToXY } from '#shared/helpers/exercise/disc_wheel_geometry'

/**
 * Décor statique de la roue DISC (dégradés, libellés, pastilles de traits), sans interaction :
 * séparé de `DiscWheel` qui gère survol, focus et popup.
 *
 * viewBox plus large que haut : les libellés latéraux (« Coordonnant ») tiennent dedans.
 */
export const DISC_WHEEL_VIEW = {
  width: 500,
  height: 390,
  cx: 250,
  cy: 195,
  radius: 140,
} as const

const LABEL_GAP = 12

/** Rayons des bornes d'anneaux, du disque central au bord. */
export const DISC_WHEEL_RING_RADII = DISC_WHEEL_RINGS.map(
  (ring) => ring.to * DISC_WHEEL_VIEW.radius
)

const { cx, cy, radius } = DISC_WHEEL_VIEW

/** Libellé de zone juste hors de la roue, aligné vers l'extérieur. */
function labelPlacement(angle: number) {
  const sin = Math.sin((angle * Math.PI) / 180)
  const cos = Math.cos((angle * Math.PI) / 180)
  const at = polarToXY(cx, cy, radius + LABEL_GAP, angle)
  const textAnchor: 'start' | 'middle' | 'end' =
    Math.abs(sin) < 0.2 ? 'middle' : sin > 0 ? 'start' : 'end'
  // Haut et bas : décaler pour que le texte ne touche pas la roue.
  const dy = Math.abs(sin) < 0.2 ? (cos > 0 ? -8 : 10) : 0
  return { x: at.x, y: at.y + dy, textAnchor }
}

/** Dégradés des zones mixtes, d'un trait voisin à l'autre (ids préfixés par instance). */
export function DiscWheelGradients({ prefix }: { prefix: string }) {
  return (
    <defs>
      {DISC_WHEEL_ZONES.filter((zone) => zone.traits.length === 2).map((zone) => {
        const { start, end } = discWheelZoneBounds(zone)
        const from = polarToXY(cx, cy, radius, start)
        const to = polarToXY(cx, cy, radius, end)
        const [first, second] = zone.traits
        return (
          <linearGradient
            key={zone.key}
            id={`${prefix}-${zone.key}`}
            gradientUnits="userSpaceOnUse"
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
          >
            <stop offset="0%" stopColor={DISC_TRAIT_PALETTE[first].boldHex} />
            <stop offset="100%" stopColor={DISC_TRAIT_PALETTE[second ?? first].boldHex} />
          </linearGradient>
        )
      })}
    </defs>
  )
}

/** Libellés des huit zones, hors des aplats ; celui du candidat en accent. */
export function DiscWheelZoneLabels({
  candidateZoneKey,
}: {
  candidateZoneKey: DiscWheelZoneKey | null
}) {
  return (
    <>
      {DISC_WHEEL_ZONES.map((zone) => {
        const at = labelPlacement(zone.angle)
        return (
          <text
            key={zone.key}
            x={at.x}
            y={at.y}
            textAnchor={at.textAnchor}
            dominantBaseline="middle"
            aria-hidden="true"
            fontSize={15}
            className={`pointer-events-none font-extrabold ${
              zone.key === candidateZoneKey ? 'fill-accent' : 'fill-ink'
            }`}
          >
            {zone.label}
          </text>
        )
      })}
    </>
  )
}

/** Pastilles D / I / S / C dans le premier anneau (lecture « boussole »). */
export function DiscWheelTraitPills() {
  const pillRadius = (DISC_WHEEL_RING_RADII[0] + DISC_WHEEL_RING_RADII[1]) / 2
  return (
    <>
      {DISC_WHEEL_TRAITS.map((trait) => {
        const at = polarToXY(cx, cy, pillRadius, DISC_WHEEL_TRAIT_ANGLES[trait])
        return (
          <g key={trait} aria-hidden="true" data-trait-pill={trait} className="pointer-events-none">
            <circle cx={at.x} cy={at.y} r={12} className="fill-surface stroke-hairline-strong" />
            <text
              x={at.x}
              y={at.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={13}
              className="fill-ink font-extrabold"
            >
              {trait}
            </text>
          </g>
        )
      })}
    </>
  )
}
