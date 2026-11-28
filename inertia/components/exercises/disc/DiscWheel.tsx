import { useId, useMemo, useRef, useState } from 'react'
import {
  DISC_TRAIT_PALETTE,
  DISC_WHEEL_TRAIT_LABELS,
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
import {
  DISC_WHEEL_RING_RADII,
  DISC_WHEEL_VIEW,
  DiscWheelGradients,
  DiscWheelTraitPills,
  DiscWheelZoneLabels,
} from './DiscWheelDecor'
import { DiscWheelPanel, DiscWheelPopover, type DiscWheelPopoverTarget } from './DiscWheelPopover'

const { width: WIDTH, height: HEIGHT, cx: CENTER, cy: CENTER_Y, radius: RADIUS } = DISC_WHEEL_VIEW
/** Opacité des aplats par anneau, du centre vers le bord : l'intensité se lit à la couleur. */
const RING_OPACITY = [0.35, 0.6, 0.9]

type ActiveKey = DiscWheelZoneKey | 'point' | null

interface DiscWheelProps {
  percent: DiscPercentInput
}

function toPercent(point: { x: number; y: number }): { x: number; y: number } {
  return { x: (point.x / WIDTH) * 100, y: (point.y / HEIGHT) * 100 }
}

function zoneFill(zone: DiscWheelZone, gradientPrefix: string): string {
  return zone.traits.length === 1
    ? DISC_TRAIT_PALETTE[zone.traits[0]].boldHex
    : `url(#${gradientPrefix}-${zone.key})`
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
  /**
   * Élément qui a le focus (clavier, clic ou toucher) : quitter une zone à la souris
   * revient à lui au lieu de tout fermer.
   */
  const focusedRef = useRef<ActiveKey>(null)

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
    'onMouseLeave': () => setActive(focusedRef.current),
    'onFocus': () => {
      focusedRef.current = key
      setActive(key)
    },
    'onBlur': () => {
      focusedRef.current = null
      setActive((current) => (current === key ? null : current))
    },
    // Un toucher émet mouseenter + focus avant click : le clic ouvre toujours, sans basculer,
    // sinon la carte se refermerait aussitôt sur mobile. Fermeture : Échap, blur, survol ailleurs.
    'onClick': () => setActive(key),
    'onKeyDown': (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') setActive(null)
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        setActive((current) => (current === key ? null : key))
      }
    },
  })

  const ringRadii = DISC_WHEEL_RING_RADII
  const centerRadius = ringRadii[0]

  return (
    <div className="space-y-4">
      <div
        data-testid="disc-wheel"
        className="relative mx-auto w-full max-w-lg"
        onMouseLeave={() => setActive(focusedRef.current)}
      >
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full overflow-visible"
          role="group"
          aria-label="Roue DISC : huit styles de comportement et votre position"
        >
          <DiscWheelGradients prefix={gradientPrefix} />

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

          <DiscWheelZoneLabels candidateZoneKey={candidateZoneKey} />
          <DiscWheelTraitPills />

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

      <DiscWheelPanel target={target} candidateZoneKey={candidateZoneKey} />

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
