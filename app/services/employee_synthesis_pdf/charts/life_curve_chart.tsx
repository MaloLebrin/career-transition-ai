import {
  Circle as SvgCircle,
  ClipPath,
  Defs,
  Line as SvgLine,
  Path as SvgPath,
  Rect,
  Svg,
  Text,
  View,
} from '@react-pdf/renderer'
import {
  LIFE_CURVE_REFLECTION_KEYS,
  LIFE_CURVE_REFLECTION_LABELS,
  LIFE_CURVE_TEXTS,
} from '#shared/constants/life_curve'
import {
  buildLifeCurveTimeline,
  normalizeLifeCurveEvents,
  type LifeCurveMarker,
} from '#shared/helpers/exercise/life_curve_timeline'
import { C } from '../styles.js'
import { safeObj, SvgText } from './chart_helpers.js'

// ─── LIFE_CURVE ───────────────────────────────────────────────────────────────

/** Repère de la frise (points PDF) : même géométrie que la page de résultat. */
const SIZE = {
  width: 432,
  height: 130,
  padLeft: 20,
  padRight: 22,
  padTop: 8,
  padBottom: 8,
  minYearGap: 26,
}

/**
 * Suffixe des `ClipPath` : leurs identifiants valent pour tout le document, et
 * rien n'empêche un jour deux courbes de vie dans le même PDF.
 */
let clipSequence = 0

const DOT: Record<LifeCurveMarker['tone'], string> = {
  high: C.highInk,
  low: C.lowInk,
  neutral: C.ink,
}
const BADGE: Record<LifeCurveMarker['tone'], { bg: string; fg: string }> = {
  high: { bg: C.highBg, fg: C.highInk },
  low: { bg: C.lowBg, fg: C.lowInk },
  neutral: { bg: C.lightGray, fg: C.medium },
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
      <View
        style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: 4 }}
      />
      <Text style={{ fontSize: 8, color: C.gray }}>{label}</Text>
    </View>
  )
}

export function LifeCurveChart({ data }: { data: unknown }) {
  const d = safeObj(data)
  const events = normalizeLifeCurveEvents(d.points)
  const reflection = safeObj(d.reflection)
  const timeline = buildLifeCurveTimeline(events, SIZE)

  if (!timeline) return null

  const { markers } = timeline
  clipSequence += 1
  const highClipId = `life-curve-high-${clipSequence}`
  const lowClipId = `life-curve-low-${clipSequence}`

  const reflectionEntries = LIFE_CURVE_REFLECTION_KEYS.filter((k) =>
    String(reflection[k] ?? '').trim()
  ).map((k) => [LIFE_CURVE_REFLECTION_LABELS[k], String(reflection[k])] as const)

  return (
    <View style={{ marginBottom: 8 }}>
      {/* Frise */}
      <View
        style={{
          backgroundColor: C.white,
          borderRadius: 6,
          padding: 8,
          borderWidth: 1,
          borderColor: C.lightGray,
          marginBottom: 8,
        }}
      >
        {/* Légende et frise insécables ; la liste des événements, elle, peut passer
            à la page suivante (une longue carrière ne tient pas sur une page). */}
        <View wrap={false}>
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            <LegendSwatch color={C.highBg} label={LIFE_CURVE_TEXTS.LEGEND_HIGH} />
            <LegendSwatch color={C.lowBg} label={LIFE_CURVE_TEXTS.LEGEND_LOW} />
          </View>

          <Svg width={SIZE.width} height={SIZE.height}>
            <Defs>
              <ClipPath id={highClipId}>
                <Rect {...timeline.highClip} />
              </ClipPath>
              <ClipPath id={lowClipId}>
                <Rect {...timeline.lowClip} />
              </ClipPath>
            </Defs>

            <SvgPath d={timeline.areaPath} fill={C.highBg} clipPath={`url(#${highClipId})`} />
            <SvgPath d={timeline.areaPath} fill={C.lowBg} clipPath={`url(#${lowClipId})`} />

            {markers.map((m) => (
              <SvgLine
                key={`guide-${m.year}`}
                x1={m.x}
                y1={timeline.axisY}
                x2={m.x}
                y2={m.curveY}
                stroke={C.gray}
                strokeWidth={0.5}
                strokeDasharray="1.5,2"
              />
            ))}

            <SvgPath d={timeline.curvePath} fill="none" stroke={C.ink} strokeWidth={1.6} />

            <SvgLine
              x1={timeline.axisStartX}
              y1={timeline.axisY}
              x2={timeline.axisEndX}
              y2={timeline.axisY}
              stroke={C.ink}
              strokeWidth={1.6}
            />
            <SvgPath d={timeline.arrowPath} fill={C.ink} />

            {markers.map((m) => (
              <SvgCircle
                key={`curve-${m.year}`}
                cx={m.x}
                cy={m.curveY}
                r={2.2}
                fill={DOT[m.tone]}
              />
            ))}
            {markers.map((m) => (
              <SvgCircle
                key={`axis-${m.year}`}
                cx={m.x}
                cy={timeline.axisY}
                r={3.6}
                fill={C.ink}
                stroke={C.white}
                strokeWidth={1}
              />
            ))}
            {markers
              .filter((m) => m.showYear)
              .map((m) => (
                <SvgText
                  key={`year-${m.year}`}
                  x={m.x}
                  y={m.labelSide === 'below' ? timeline.axisY + 13 : timeline.axisY - 7}
                  fontSize={7}
                  fill={C.ink}
                  textAnchor="middle"
                >
                  {m.year}
                </SvgText>
              ))}
          </Svg>
        </View>

        {/* Événements */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
          {markers.map((m) => (
            <View
              key={`event-${m.year}`}
              wrap={false}
              style={{
                width: '50%',
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 1.5,
              }}
            >
              <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.ink, width: 26 }}>
                {m.year}
              </Text>
              <Text style={{ fontSize: 8, color: C.medium, flex: 1, paddingRight: 4 }}>
                {m.label || LIFE_CURVE_TEXTS.UNLABELED_EVENT}
              </Text>
              <Text
                style={{
                  fontSize: 7,
                  fontFamily: 'Helvetica-Bold',
                  color: BADGE[m.tone].fg,
                  backgroundColor: BADGE[m.tone].bg,
                  borderRadius: 6,
                  paddingHorizontal: 4,
                  paddingVertical: 1,
                  marginRight: 8,
                }}
              >
                {m.satisfaction}/10
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Réflexion du candidat */}
      {reflectionEntries.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {reflectionEntries.map(([label, value]) => (
            <View
              key={label}
              style={{
                width: '47%',
                backgroundColor: C.white,
                borderRadius: 4,
                padding: 8,
                borderWidth: 1,
                borderColor: C.lightGray,
              }}
              wrap={false}
            >
              <Text
                style={{
                  fontSize: 8,
                  fontFamily: 'Helvetica-Bold',
                  color: C.gray,
                  marginBottom: 3,
                }}
              >
                {label}
              </Text>
              <Text style={{ fontSize: 9, color: C.medium, lineHeight: 1.5 }}>{value}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
