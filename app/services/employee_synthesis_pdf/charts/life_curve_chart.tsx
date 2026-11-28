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
const SIZE = { width: 432, height: 130, padLeft: 20, padRight: 22, padTop: 8, padBottom: 8 }
const MIN_YEAR_GAP = 26

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
  const spacing = markers[1].x - markers[0].x
  const yearStep = Math.max(1, Math.ceil(MIN_YEAR_GAP / spacing))

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
        wrap={false}
      >
        <View style={{ flexDirection: 'row', marginBottom: 4 }}>
          <LegendSwatch color={C.highBg} label="Hauts : au-dessus de 5/10" />
          <LegendSwatch color={C.lowBg} label="Bas : au-dessous de 5/10" />
        </View>

        <Svg width={SIZE.width} height={SIZE.height}>
          <Defs>
            <ClipPath id="life-curve-high">
              <Rect {...timeline.highClip} />
            </ClipPath>
            <ClipPath id="life-curve-low">
              <Rect {...timeline.lowClip} />
            </ClipPath>
          </Defs>

          <SvgPath d={timeline.areaPath} fill={C.highBg} clipPath="url(#life-curve-high)" />
          <SvgPath d={timeline.areaPath} fill={C.lowBg} clipPath="url(#life-curve-low)" />

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
            <SvgCircle key={`curve-${m.year}`} cx={m.x} cy={m.curveY} r={2.2} fill={DOT[m.tone]} />
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
            .filter((_, i) => i % yearStep === 0 || i === markers.length - 1)
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

        {/* Événements */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
          {markers.map((m) => (
            <View
              key={`event-${m.year}`}
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
                {m.label || 'Sans libellé'}
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
