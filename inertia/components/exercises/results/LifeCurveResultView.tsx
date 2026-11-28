import {
  LIFE_CURVE_REFLECTION_KEYS,
  LIFE_CURVE_REFLECTION_LABELS,
  LIFE_CURVE_TEXTS,
  type LifeCurveReflectionKey,
} from '#shared/constants/life_curve'
import { normalizeLifeCurveEvents } from '#shared/helpers/exercise/life_curve_timeline'
import Card from '~/components/ui/Card'
import { LifeCurveEventList } from './LifeCurveEventList'
import { LifeCurveTimeline } from './LifeCurveTimeline'

interface Props {
  points: unknown
  reflection: Record<string, string>
}

const isKnownKey = (key: string): key is LifeCurveReflectionKey =>
  (LIFE_CURVE_REFLECTION_KEYS as readonly string[]).includes(key)

function reflectionEntries(reflection: Record<string, string>): Array<[string, string]> {
  const known = LIFE_CURVE_REFLECTION_KEYS.filter((k) => String(reflection[k] ?? '').trim()).map(
    (k): [string, string] => [LIFE_CURVE_REFLECTION_LABELS[k], String(reflection[k])]
  )
  const others = Object.entries(reflection)
    .filter(([k, v]) => !isKnownKey(k) && String(v ?? '').trim())
    .map(([k, v]): [string, string] => [k, String(v)])
  return [...known, ...others]
}

export default function LifeCurveResultView({ points, reflection }: Props) {
  const events = normalizeLifeCurveEvents(points)
  const entries = reflectionEntries(reflection ?? {})

  return (
    <div className="space-y-8 animate-fadeIn">
      {events.length >= 2 ? (
        <Card padding="lg" className="space-y-6">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-caption text-muted">
            <span className="flex items-center gap-2">
              <span aria-hidden className="size-3 rounded-full bg-tint-blossom" />
              {LIFE_CURVE_TEXTS.LEGEND_HIGH}
            </span>
            <span className="flex items-center gap-2">
              <span aria-hidden className="size-3 rounded-full bg-tint-sun" />
              {LIFE_CURVE_TEXTS.LEGEND_LOW}
            </span>
          </div>
          <LifeCurveTimeline events={events} />
          <LifeCurveEventList events={events} />
        </Card>
      ) : (
        <Card padding="lg">
          <p className="text-muted">Pas assez d’événements pour tracer la frise.</p>
        </Card>
      )}

      {entries.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {entries.map(([label, value]) => (
            <Card key={label} padding="md">
              <h4 className="mb-2 text-caption text-muted">{label}</h4>
              <p className="font-bold leading-relaxed text-ink">{value}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
