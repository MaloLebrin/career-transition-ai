import {
  DISC_TRAIT_PALETTE,
  DISC_WHEEL_TRAIT_LABELS,
  type DiscWheelZone,
} from '#shared/constants/disc_wheel'
import type { DiscWheelPosition } from '#shared/helpers/exercise/disc_wheel_geometry'

export type DiscWheelPopoverTarget =
  | { kind: 'zone'; zone: DiscWheelZone }
  | { kind: 'point'; position: DiscWheelPosition }

interface DiscWheelPopoverProps {
  id: string
  target: DiscWheelPopoverTarget
  /** Zone du candidat, pour signaler « Votre profil se situe ici ». */
  candidateZoneKey: string | null
  /** Ancre en % du conteneur (0..100). */
  anchor: { x: number; y: number }
}

function TraitPills({ zone }: { zone: DiscWheelZone }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {zone.traits.map((trait, index) => {
        const palette = DISC_TRAIT_PALETTE[trait]
        return (
          <span key={trait} className="inline-flex items-center gap-1.5">
            {index > 0 && (
              <span className="text-caption text-muted" aria-hidden="true">
                +
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-bold ${palette.softBgClass} ${palette.textClass}`}
            >
              {trait} · {DISC_WHEEL_TRAIT_LABELS[trait]}
            </span>
          </span>
        )
      })}
    </div>
  )
}

function ZoneContent({ zone, isCandidateZone }: { zone: DiscWheelZone; isCandidateZone: boolean }) {
  return (
    <>
      <p className="text-title-sm text-ink">{zone.label}</p>
      <div className="mt-2">
        <TraitPills zone={zone} />
      </div>
      <p className="mt-3 text-sm text-muted">{zone.description}</p>
      <p className="mt-2 text-caption text-muted">{zone.keywords.join(' · ')}</p>
      {isCandidateZone && (
        <p className="mt-3 text-sm font-bold text-accent">Votre profil se situe ici</p>
      )}
    </>
  )
}

function PointContent({ position }: { position: DiscWheelPosition }) {
  if (!position.zone) {
    return (
      <>
        <p className="text-title-sm text-ink">Votre position</p>
        <p className="mt-2 text-sm text-muted">
          Profil équilibré : aucun style ne domine, vous adaptez votre comportement selon les
          situations.
        </p>
      </>
    )
  }
  return (
    <>
      <p className="text-title-sm text-ink">Votre position</p>
      <p className="mt-2 text-sm text-ink-soft">
        Zone <span className="font-bold">{position.zone.label}</span>, tendance{' '}
        {position.ring.label}.
      </p>
      <p className="mt-2 text-sm text-muted">{position.zone.description}</p>
      <p className="mt-2 text-caption text-muted">
        Plus le point est loin du centre, plus ce style est marqué.
      </p>
    </>
  )
}

/**
 * Carte d'explication affichée au survol / focus d'une zone ou du point de la roue DISC.
 * Dès `sm`, elle flotte et s'ouvre vers le centre de la roue pour ne pas déborder ;
 * en dessous, elle s'affiche sous la roue.
 */
export function DiscWheelPopover({ id, target, candidateZoneKey, anchor }: DiscWheelPopoverProps) {
  // Ancre proche de l'axe vertical : carte centrée, ouverte vers le centre de la roue.
  const centered = Math.abs(anchor.x - 50) < 15
  const opensLeft = anchor.x > 50
  const opensUp = anchor.y > 50
  const style: React.CSSProperties = centered
    ? {
        left: '50%',
        ...(opensUp ? { bottom: `${100 - anchor.y}%` } : { top: `${anchor.y}%` }),
      }
    : {
        top: `${Math.max(8, Math.min(92, anchor.y))}%`,
        ...(opensLeft ? { right: `${100 - anchor.x}%` } : { left: `${anchor.x}%` }),
      }
  // Sous `sm`, la roue est trop petite pour une carte flottante : la carte suit la roue
  // (position statique, les décalages inline sont alors ignorés).
  const placement = centered
    ? `sm:-translate-x-1/2 ${opensUp ? 'sm:mt-0 sm:mb-4' : 'sm:mt-4'}`
    : `sm:mt-0 sm:-translate-y-1/2 ${opensLeft ? 'sm:mr-3' : 'sm:ml-3'}`

  return (
    <div
      id={id}
      role="tooltip"
      data-testid="disc-wheel-popover"
      style={style}
      className={`pointer-events-none static z-10 mt-3 w-full rounded-xl sm:absolute sm:w-60 sm:max-w-[75%] border border-hairline bg-surface p-4 shadow-raised motion-safe:animate-fade-in ${placement}`}
    >
      {target.kind === 'zone' ? (
        <ZoneContent zone={target.zone} isCandidateZone={target.zone.key === candidateZoneKey} />
      ) : (
        <PointContent position={target.position} />
      )}
    </div>
  )
}
