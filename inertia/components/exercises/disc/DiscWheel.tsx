import { useId, useMemo, useState } from 'react'
import {
  DISC_TRAIT_PALETTE,
  DISC_WHEEL_RINGS,
  DISC_WHEEL_TRAIT_ANGLES,
  DISC_WHEEL_TRAIT_LABELS,
  DISC_WHEEL_TRAITS,
  DISC_WHEEL_ZONES,
  type DiscWheelZone,
  type DiscWheelZoneKey,
} from '#shared/constants/disc_wheel'
import {
  discWheelPoint,
  discWheelPosition,
  discWheelZoneBounds,
  polarToXY,
  sectorPath,
  type DiscPercentInput,
} from '#shared/helpers/exercise/disc_wheel_geometry'
import { DiscWheelPopover, type DiscWheelPopoverTarget } from './DiscWheelPopover'

/** viewBox plus large que haut : les libellés latéraux (« Coordonnant ») tiennent dedans. */
const WIDTH = 500
const HEIGHT = 390
const CENTER = WIDTH / 2
const CENTER_Y = HEIGHT / 2
const RADIUS = 140
const LABEL_GAP = 12
/** Opacité des aplats par anneau, du centre vers le bord : l'intensité se lit à la couleur. */
const RING_OPACITY = [0.35, 0.6, 0.9]

type ActiveKey = DiscWheelZoneKey | 'point' | null

interface DiscWheelProps {
  percent: DiscPercentInput
}

function toPercent(point: { x: number; y: number }): { x: number; y: number } {
  return { x: (point.x / WIDTH) * 100, y: (point.y / HEIGHT) * 100 }
}

/** Libellé de zone juste hors de la roue, aligné vers l'extérieur. */
function labelPlacement(angle: number) {
  const sin = Math.sin((angle * Math.PI) / 180)
  const cos = Math.cos((angle * Math.PI) / 180)
  const at = polarToXY(CENTER, CENTER_Y, RADIUS + LABEL_GAP, angle)
  const textAnchor: 'start' | 'middle' | 'end' =
    Math.abs(sin) < 0.2 ? 'middle' : sin > 0 ? 'start' : 'end'
  // Haut et bas : décaler pour que le texte ne touche pas la roue.
  const dy = Math.abs(sin) < 0.2 ? (cos > 0 ? -8 : 10) : 0
  return { x: at.x, y: at.y + dy, textAnchor }
}

function zoneFill(zone: DiscWheelZone, gradientPrefix: string): string {
  return zone.traits.length === 1
    ? DISC_TRAIT_PALETTE[zone.traits[0]].boldHex
    : `url(#${gradientPrefix}-${zone.key})`
}

function ZoneGradients({ prefix }: { prefix: string }) {
  return (
    <defs>
      {DISC_WHEEL_ZONES.filter((zone) => zone.traits.length === 2).map((zone) => {
        const { start, end } = discWheelZoneBounds(zone)
        const from = polarToXY(CENTER, CENTER_Y, RADIUS, start)
        const to = polarToXY(CENTER, CENTER_Y, RADIUS, end)
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

/**
 * Roue DISC à huit zones : survoler (ou atteindre au clavier) une zone ouvre une carte
 * d'explication ; le point placé par `discWheelPosition` montre où se situe le candidat.
 * Aplats en teintes `tint-x-bold` de la charte, libellés en encre hors des aplats.
 */
export function DiscWheel({ percent }: DiscWheelProps) {
  const uid = useId().replace(/:/g, '')
  const gradientPrefix = `disc-wheel-${uid}`
  const popoverId = `disc-wheel-popover-${uid}`
  const [active, setActive] = useState<ActiveKey>(null)

  const position = useMemo(() => discWheelPosition(percent), [percent])
  const point = discWheelPoint(position, CENTER, CENTER_Y, RADIUS)
  const candidateZoneKey = position.zone?.key ?? null
  const pointLabel = position.zone
    ? `Votre position : zone ${position.zone.label}, tendance ${position.ring.label}`
    : 'Votre position : profil équilibré'

  const activeZone = DISC_WHEEL_ZONES.find((zone) => zone.key === active) ?? null
  const target: DiscWheelPopoverTarget | null =
    active === 'point'
      ? { kind: 'point', position }
      : activeZone
        ? { kind: 'zone', zone: activeZone }
        : null
  const anchorPoint =
    active === 'point'
      ? point
      : activeZone
        ? polarToXY(CENTER, CENTER_Y, RADIUS * 0.62, activeZone.angle)
        : null

  const interactiveProps = (key: Exclude<ActiveKey, null>, label: string) => ({
    'tabIndex': 0,
    'role': 'button',
    'aria-label': label,
    'aria-describedby': active === key ? popoverId : undefined,
    'aria-expanded': active === key,
    'onMouseEnter': () => setActive(key),
    'onMouseLeave': () => setActive((current) => (current === key ? null : current)),
    'onFocus': () => setActive(key),
    'onBlur': () => setActive((current) => (current === key ? null : current)),
    'onClick': () => setActive((current) => (current === key ? null : key)),
    'onKeyDown': (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') setActive(null)
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        setActive((current) => (current === key ? null : key))
      }
    },
  })

  const ringRadii = DISC_WHEEL_RINGS.map((ring) => ring.to * RADIUS)
  const centerRadius = ringRadii[0]

  return (
    <div className="space-y-4">
      <div
        data-testid="disc-wheel"
        className="relative mx-auto w-full max-w-lg"
        onMouseLeave={() => setActive(null)}
      >
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full overflow-visible"
          role="group"
          aria-label="Roue DISC : huit styles de comportement et votre position"
        >
          <ZoneGradients prefix={gradientPrefix} />

          {DISC_WHEEL_ZONES.map((zone) => {
            const { start, end } = discWheelZoneBounds(zone)
            const dimmed = active !== null && active !== 'point' && active !== zone.key
            const fill = zoneFill(zone, gradientPrefix)
            return (
              <g
                key={zone.key}
                data-zone={zone.key}
                className="group cursor-pointer outline-none transition-opacity duration-200"
                style={{ opacity: dimmed ? 0.35 : 1 }}
                {...interactiveProps(
                  zone.key,
                  `Zone ${zone.label} (${zone.traits.length === 1 ? 'trait' : 'traits'} ${zone.traits.map((t) => `${t} ${DISC_WHEEL_TRAIT_LABELS[t]}`).join(' + ')})`
                )}
              >
                {RING_OPACITY.map((opacity, index) => (
                  <path
                    key={index}
                    d={sectorPath(
                      CENTER,
                      CENTER_Y,
                      ringRadii[index],
                      ringRadii[index + 1],
                      start,
                      end
                    )}
                    fill={fill}
                    fillOpacity={active === zone.key ? Math.min(1, opacity + 0.1) : opacity}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                ))}
                {/* Zone de survol pleine + contour de focus. */}
                <path
                  d={sectorPath(CENTER, CENTER_Y, centerRadius, RADIUS, start, end)}
                  fill="transparent"
                  className="stroke-transparent group-focus-visible:stroke-accent"
                  strokeWidth={3}
                />
              </g>
            )
          })}

          {/* Disque central : profil équilibré. */}
          <circle
            cx={CENTER}
            cy={CENTER_Y}
            r={centerRadius}
            className="fill-surface stroke-hairline-strong"
            strokeWidth={1.5}
          />

          {/* Libellés des zones, hors des aplats. */}
          {DISC_WHEEL_ZONES.map((zone) => {
            const at = labelPlacement(zone.angle)
            const isCandidate = zone.key === candidateZoneKey
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
                  isCandidate ? 'fill-accent' : 'fill-ink'
                }`}
              >
                {zone.label}
              </text>
            )
          })}

          {/* Pastilles des traits, dans le premier anneau (lecture « boussole »). */}
          {DISC_WHEEL_TRAITS.map((trait) => {
            const at = polarToXY(
              CENTER,
              CENTER_Y,
              (ringRadii[0] + ringRadii[1]) / 2,
              DISC_WHEEL_TRAIT_ANGLES[trait]
            )
            return (
              <g key={trait} aria-hidden="true" className="pointer-events-none">
                <circle
                  cx={at.x}
                  cy={at.y}
                  r={12}
                  className="fill-surface stroke-hairline-strong"
                />
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

          {/* Point du candidat. */}
          <g
            data-testid="disc-wheel-point"
            className="group cursor-pointer outline-none"
            {...interactiveProps('point', pointLabel)}
          >
            <circle
              cx={point.x}
              cy={point.y}
              r={20}
              className="fill-ink stroke-transparent group-focus-visible:stroke-accent"
              fillOpacity={0.12}
              strokeWidth={3}
            />
            <circle
              cx={point.x}
              cy={point.y}
              r={9}
              className="fill-ink stroke-surface"
              strokeWidth={3}
            />
          </g>
        </svg>

        {target && anchorPoint && (
          <DiscWheelPopover
            id={popoverId}
            target={target}
            candidateZoneKey={candidateZoneKey}
            anchor={toPercent(anchorPoint)}
          />
        )}
      </div>

      <p className="text-center text-sm text-muted" data-testid="disc-wheel-reading">
        {position.zone ? (
          <>
            Votre profil se situe dans la zone{' '}
            <span className="font-bold text-ink">{position.zone.label}</span> (tendance{' '}
            {position.ring.label}).
          </>
        ) : (
          <>Votre profil est équilibré : aucun style ne domine.</>
        )}{' '}
        Survolez ou touchez une zone pour la découvrir.
      </p>
    </div>
  )
}
