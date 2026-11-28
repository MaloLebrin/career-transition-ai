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

function TargetContent({
  target,
  candidateZoneKey,
}: {
  target: DiscWheelPopoverTarget
  candidateZoneKey: string | null
}) {
  return target.kind === 'zone' ? (
    <ZoneContent zone={target.zone} isCandidateZone={target.zone.key === candidateZoneKey} />
  ) : (
    <PointContent position={target.position} />
  )
}

/**
 * Carte d'explication flottante, affichée dès `sm` au survol / focus d'une zone ou du point
 * de la roue DISC. Elle s'ouvre vers le centre de la roue pour ne pas déborder.
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
  const placement = centered
    ? `-translate-x-1/2 ${opensUp ? 'mb-4' : 'mt-4'}`
    : `-translate-y-1/2 ${opensLeft ? 'mr-3' : 'ml-3'}`

  return (
    <div
      id={id}
      role="tooltip"
      data-testid="disc-wheel-popover"
      style={style}
      className={`pointer-events-none absolute z-10 hidden w-60 max-w-[75%] rounded-xl border border-hairline bg-surface p-4 shadow-raised motion-safe:animate-fade-in sm:block ${placement}`}
    >
      <TargetContent target={target} candidateZoneKey={candidateZoneKey} />
    </div>
  )
}

/**
 * Sous `sm`, la roue est trop petite pour une carte flottante : un panneau de hauteur
 * réservée sous la roue affiche la zone touchée, sans décaler la page à chaque toucher.
 * Doublon visuel de la carte flottante (masquée à cette taille), caché aux lecteurs d'écran
 * qui lisent déjà la carte via `aria-describedby`.
 */
export function DiscWheelPanel({
  target,
  candidateZoneKey,
}: {
  target: DiscWheelPopoverTarget | null
  candidateZoneKey: string | null
}) {
  return (
    <div
      aria-hidden="true"
      data-testid="disc-wheel-panel"
      className="grid min-h-56 rounded-xl border border-hairline bg-surface-soft p-4 sm:hidden"
    >
      {target ? (
        <div>
          <TargetContent target={target} candidateZoneKey={candidateZoneKey} />
        </div>
      ) : (
        <p className="self-center text-center text-sm text-muted">
          Touchez une zone ou le point pour afficher sa description.
        </p>
      )}
    </div>
  )
}
