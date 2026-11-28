import type { LifeCurveEvent } from '#shared/helpers/exercise/life_curve_timeline'
import { LIFE_CURVE_SCALE, LIFE_CURVE_TEXTS } from '#shared/constants/life_curve'
import Badge, { type BadgeTone } from '~/components/ui/Badge'

function toneOf(satisfaction: number): BadgeTone {
  if (satisfaction > LIFE_CURVE_SCALE.NEUTRAL) return 'blossom'
  if (satisfaction < LIFE_CURVE_SCALE.NEUTRAL) return 'sun'
  return 'neutral'
}

interface Props {
  events: LifeCurveEvent[]
}

/** Légende de la frise : chaque point de l'axe, son année, son événement et son niveau. */
export function LifeCurveEventList({ events }: Props) {
  if (events.length === 0) return null
  return (
    <ol className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2" aria-label="Événements">
      {events.map((e) => (
        <li key={e.year} className="flex items-baseline gap-3">
          <span className="w-10 shrink-0 font-bold text-ink tabular-nums">{e.year}</span>
          <span className="min-w-0 flex-1 text-ink-soft">
            {e.label || LIFE_CURVE_TEXTS.UNLABELED_EVENT}
          </span>
          <Badge variant={toneOf(e.satisfaction)} className="shrink-0 tabular-nums">
            {e.satisfaction}/10
          </Badge>
        </li>
      ))}
    </ol>
  )
}
