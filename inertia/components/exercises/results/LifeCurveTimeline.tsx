import { useId } from 'react'
import {
  buildLifeCurveTimeline,
  type LifeCurveEvent,
  type LifeCurveMarker,
} from '#shared/helpers/exercise/life_curve_timeline'

/** Repère SVG : la frise s'étire en largeur, le texte garde une taille lisible (min-width). */
const SIZE = { width: 720, height: 260, padLeft: 36, padRight: 36, padTop: 24, padBottom: 24 }
/** Écart minimal entre deux années affichées sous l'axe. */
const MIN_YEAR_GAP = 36

const DOT_FILL: Record<LifeCurveMarker['tone'], string> = {
  high: 'var(--color-tint-blossom-ink)',
  low: 'var(--color-tint-sun-ink)',
  neutral: 'var(--color-ink)',
}

function markerTitle(marker: LifeCurveMarker): string {
  const label = marker.label ? ` · ${marker.label}` : ''
  return `${marker.year}${label} · ${marker.satisfaction}/10`
}

interface Props {
  events: LifeCurveEvent[]
}

/**
 * Frise de la courbe de vie : l'axe marque le niveau neutre (5/10), les hauts
 * se lisent en rose au-dessus, les bas en jaune au-dessous ; chaque événement
 * a son point sur l'axe, relié à la courbe.
 */
export function LifeCurveTimeline({ events }: Props) {
  const clipId = useId()
  const timeline = buildLifeCurveTimeline(events, SIZE)
  if (!timeline) return null

  const { markers } = timeline
  const spacing = markers.length > 1 ? markers[1].x - markers[0].x : SIZE.width
  const yearStep = Math.max(1, Math.ceil(MIN_YEAR_GAP / spacing))
  const showYear = (i: number) => i % yearStep === 0 || i === markers.length - 1

  const highs = markers.filter((m) => m.tone === 'high').length
  const lows = markers.filter((m) => m.tone === 'low').length
  const summary = `Frise de ${markers[0].year} à ${markers.at(-1)!.year} : ${markers.length} événements, ${highs} au-dessus et ${lows} au-dessous du niveau neutre.`

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${SIZE.width} ${SIZE.height}`}
        className="block h-auto w-full min-w-[560px]"
        role="img"
        aria-label={summary}
      >
        <defs>
          <clipPath id={`${clipId}-high`}>
            <rect {...timeline.highClip} />
          </clipPath>
          <clipPath id={`${clipId}-low`}>
            <rect {...timeline.lowClip} />
          </clipPath>
        </defs>

        {/* Hauts (rose) et bas (jaune) : la même surface découpée par l'axe */}
        <path
          d={timeline.areaPath}
          fill="var(--color-tint-blossom)"
          clipPath={`url(#${clipId}-high)`}
        />
        <path d={timeline.areaPath} fill="var(--color-tint-sun)" clipPath={`url(#${clipId}-low)`} />

        {/* Repères événement → courbe */}
        {markers.map((m) => (
          <line
            key={`guide-${m.year}`}
            x1={m.x}
            y1={timeline.axisY}
            x2={m.x}
            y2={m.curveY}
            stroke="var(--color-ink)"
            strokeOpacity={0.35}
            strokeWidth={1}
            strokeDasharray="2 3"
          />
        ))}

        <path
          d={timeline.curvePath}
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth={2.5}
          strokeLinecap="round"
        />

        {/* Axe du temps */}
        <line
          x1={timeline.axisStartX}
          y1={timeline.axisY}
          x2={timeline.axisEndX}
          y2={timeline.axisY}
          stroke="var(--color-ink)"
          strokeWidth={2.5}
        />
        <path d={timeline.arrowPath} fill="var(--color-ink)" />

        {markers.map((m, i) => (
          <g
            key={m.year}
            tabIndex={0}
            className="focus:outline-none [&:focus>circle]:stroke-accent"
          >
            <title>{markerTitle(m)}</title>
            <circle cx={m.x} cy={m.curveY} r={4} fill={DOT_FILL[m.tone]} />
            <circle
              cx={m.x}
              cy={timeline.axisY}
              r={7}
              fill="var(--color-ink)"
              stroke="var(--color-surface)"
              strokeWidth={2}
            />
            {showYear(i) && (
              <text
                x={m.x}
                y={m.labelSide === 'below' ? timeline.axisY + 24 : timeline.axisY - 14}
                textAnchor="middle"
                fontSize={12}
                fontWeight={700}
                fill="var(--color-ink)"
                // Halo : l'année reste lisible sur le jaune des bas ou sur la courbe
                stroke="var(--color-surface)"
                strokeWidth={4}
                strokeLinejoin="round"
                paintOrder="stroke"
              >
                {m.year}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}
