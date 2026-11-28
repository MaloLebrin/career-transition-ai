import {
  Circle as SvgCircle,
  Line as SvgLine,
  Path as SvgPath,
  Svg,
  Text,
  View,
} from '@react-pdf/renderer'
import { C } from '../styles.js'
import { safeArr, safeObj, SvgText } from './chart_helpers.js'
import { monotonePath } from './monotone_path.js'

// ─── LIFE_CURVE ───────────────────────────────────────────────────────────────

export function LifeCurveChart({ data }: { data: unknown }) {
  const d = safeObj(data)
  const points = (safeArr(d.points) as Array<{ year: number; satisfaction: number }>)
    .filter((p) => typeof p?.year === 'number' && typeof p?.satisfaction === 'number')
    .sort((a, b) => a.year - b.year)
  const reflection = safeObj(d.reflection)

  if (points.length < 2) return null

  const W = 432
  const H = 120
  const PL = 24
  const PR = 8
  const PT = 8
  const PB = 20

  const iW = W - PL - PR
  const iH = H - PT - PB

  const years = points.map((p) => p.year)
  const minYear = Math.min(...years)
  const maxYear = Math.max(...years)
  const yearRange = maxYear - minYear || 1

  const toX = (y: number) => PL + ((y - minYear) / yearRange) * iW
  const toY = (s: number) => PT + iH - (Math.min(10, Math.max(0, s)) / 10) * iH

  // Courbe lissée, comme sur la page web (recharts `type="monotone"`)
  const curve = monotonePath(points.map((p) => ({ x: toX(p.year), y: toY(p.satisfaction) })))
  const midY = toY(5)

  const reflectionEntries = Object.entries(reflection).filter(([, v]) => String(v).trim())

  return (
    <View style={{ marginBottom: 8 }}>
      {/* Line chart */}
      <View
        style={{
          backgroundColor: '#f8fafc',
          borderRadius: 6,
          padding: 8,
          borderWidth: 1,
          borderColor: C.lightGray,
          marginBottom: 8,
        }}
      >
        <Svg width={W} height={H}>
          {/* Y-axis labels */}
          <SvgText x={0} y={PT + 3} fontSize={7} fill={C.gray}>
            10
          </SvgText>
          <SvgText x={2} y={midY + 3} fontSize={7} fill={C.gray}>
            5
          </SvgText>
          <SvgText x={4} y={PT + iH + 3} fontSize={7} fill={C.gray}>
            0
          </SvgText>

          {/* Background grid */}
          {[0, 2.5, 5, 7.5, 10].map((v) => (
            <SvgLine
              key={v}
              x1={PL}
              y1={toY(v)}
              x2={W - PR}
              y2={toY(v)}
              stroke="#e5e7eb"
              strokeWidth={0.5}
            />
          ))}

          {/* Reference line at 5 */}
          <SvgLine
            x1={PL}
            y1={midY}
            x2={W - PR}
            y2={midY}
            stroke="#c4b5fd"
            strokeWidth={1}
            strokeDasharray="4,4"
          />

          {/* X-axis */}
          <SvgLine
            x1={PL}
            y1={PT + iH}
            x2={W - PR}
            y2={PT + iH}
            stroke={C.lightGray}
            strokeWidth={0.5}
          />

          {/* Year labels (max 10) */}
          {points
            .filter(
              (_, i) =>
                i % Math.max(1, Math.floor(points.length / 10)) === 0 || i === points.length - 1
            )
            .map((p) => (
              <SvgText
                key={p.year}
                x={toX(p.year)}
                y={H - 4}
                fontSize={7}
                fill={C.gray}
                textAnchor="middle"
              >
                {p.year}
              </SvgText>
            ))}

          {/* The curve */}
          <SvgPath d={curve} fill="none" stroke={C.primary} strokeWidth={2} />

          {/* Data points */}
          {points.map((p, i) => (
            <SvgCircle key={i} cx={toX(p.year)} cy={toY(p.satisfaction)} r={3} fill={C.primary} />
          ))}
        </Svg>
      </View>

      {/* Reflection notes */}
      {reflectionEntries.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {reflectionEntries.slice(0, 4).map(([key, value]) => (
            <View
              key={key}
              style={{
                width: '47%',
                backgroundColor: C.white,
                borderRadius: 4,
                padding: 8,
                borderWidth: 1,
                borderColor: C.lightGray,
              }}
            >
              <Text
                style={{
                  fontSize: 8,
                  fontFamily: 'Helvetica-Bold',
                  color: C.gray,
                  letterSpacing: 0.5,
                  marginBottom: 3,
                }}
              >
                {String(key).toUpperCase()}
              </Text>
              <Text style={{ fontSize: 9, color: C.medium, lineHeight: 1.5 }}>{String(value)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
