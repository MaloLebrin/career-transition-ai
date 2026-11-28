import { Fragment } from 'react'
import {
  Circle as SvgCircle,
  Defs as SvgDefs,
  Line as SvgLine,
  LinearGradient as SvgLinearGradient,
  Path as SvgPath,
  Polygon as SvgPolygon,
  Polyline as SvgPolyline,
  Stop as SvgStop,
  Svg,
  Text as _SvgText,
} from '@react-pdf/renderer'

// react-pdf SVG Text has a type gap with fontSize + textAnchor — cast to bypass
const SvgText = _SvgText as any
import { Text, View } from '@react-pdf/renderer'
import { RANKING_EXTREMES_COUNT, rankingExtremes } from '#shared/helpers/exercise/ranking_extremes'
import {
  DISC_TRAIT_PALETTE,
  DISC_WHEEL_RINGS,
  DISC_WHEEL_TRAIT_ANGLES,
  DISC_WHEEL_TRAIT_LABELS,
  DISC_WHEEL_TRAITS,
  DISC_WHEEL_ZONES,
  type DiscWheelTrait,
} from '#shared/constants/disc_wheel'
import {
  discRadarDomain,
  discRadarRatio,
  discRadarTicks,
  discWheelPoint,
  discWheelPosition,
  discWheelZoneBounds,
  polarToXY,
  sectorPath,
} from '#shared/helpers/exercise/disc_wheel_geometry'
import { C } from './styles.js'

// ─── DISC colors (charte, partagées avec la roue du dashboard) ─────────────────

const DISC_COLORS = Object.fromEntries(
  DISC_WHEEL_TRAITS.map((trait) => [
    trait,
    {
      bar: DISC_TRAIT_PALETTE[trait].boldHex,
      bg: DISC_TRAIT_PALETTE[trait].softHex,
      ink: DISC_TRAIT_PALETTE[trait].inkHex,
      label: DISC_WHEEL_TRAIT_LABELS[trait],
    },
  ])
) as Record<DiscWheelTrait, { bar: string; bg: string; ink: string; label: string }>

// ─── Personality traits (mirror prod labels) ──────────────────────────────────

const PERSONALITY_FIELDS = [
  { key: 'openness', label: "Ouverture d'esprit" },
  { key: 'conscientiousness', label: 'Conscience professionnelle' },
  { key: 'extraversion', label: 'Extraversion' },
  { key: 'agreeableness', label: 'Amabilité' },
  { key: 'neuroticism', label: 'Stabilité émotionnelle' },
] as const

// ─── helpers ──────────────────────────────────────────────────────────────────

function safeNum(v: unknown, fallback = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function safeArr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : []
}

function safeObj(v: unknown): Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {}
}

// ─── MOTIVATION ──────────────────────────────────────────────────────────────

function MotivationChart({ data }: { data: unknown }) {
  const d = safeObj(data)
  const { top, bottom } = rankingExtremes(safeArr(d.ranked))

  if (top.length === 0) return null

  return (
    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
      {/* Premières */}
      <View
        style={{
          flex: 1,
          backgroundColor: '#f0fdf4',
          borderRadius: 6,
          padding: 10,
          borderWidth: 1,
          borderColor: '#bbf7d0',
        }}
      >
        <Text
          style={{
            fontSize: 8,
            fontFamily: 'Helvetica-Bold',
            color: '#16a34a',
            letterSpacing: 1,
            marginBottom: 8,
          }}
        >
          LES {RANKING_EXTREMES_COUNT} PREMIÈRES
        </Text>
        {top.map((item) => (
          <View
            key={item.rank}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 }}
          >
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: '#16a34a',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 9, color: '#fff', fontFamily: 'Helvetica-Bold' }}>
                {item.rank}
              </Text>
            </View>
            <Text style={{ fontSize: 9, color: '#374151', fontFamily: 'Helvetica-Bold', flex: 1 }}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Dernières */}
      <View
        style={{
          flex: 1,
          backgroundColor: '#fff1f2',
          borderRadius: 6,
          padding: 10,
          borderWidth: 1,
          borderColor: '#fecdd3',
        }}
      >
        <Text
          style={{
            fontSize: 8,
            fontFamily: 'Helvetica-Bold',
            color: '#e11d48',
            letterSpacing: 1,
            marginBottom: 8,
          }}
        >
          LES {RANKING_EXTREMES_COUNT} DERNIÈRES
        </Text>
        {bottom.map((item) => (
          <View
            key={item.rank}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 }}
          >
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: '#e11d48',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 9, color: '#fff', fontFamily: 'Helvetica-Bold' }}>
                {item.rank}
              </Text>
            </View>
            <Text style={{ fontSize: 9, color: '#374151', flex: 1 }}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

// ─── VALUES ───────────────────────────────────────────────────────────────────

function ValuesChart({ data }: { data: unknown }) {
  const d = safeObj(data)
  const selectedValues = safeArr(d.selectedValues) as string[]
  const peopleExercise = safeArr(d.peopleExercise) as Array<{ name?: string; values?: string }>

  if (selectedValues.length === 0) return null

  return (
    <View style={{ marginBottom: 8 }}>
      {/* Hierarchy */}
      <View
        style={{
          backgroundColor: '#f9fafb',
          borderRadius: 6,
          padding: 10,
          borderWidth: 1,
          borderColor: C.lightGray,
          marginBottom: 8,
        }}
      >
        <Text
          style={{
            fontSize: 8,
            fontFamily: 'Helvetica-Bold',
            color: C.gray,
            letterSpacing: 1,
            marginBottom: 8,
          }}
        >
          HIÉRARCHIE DES VALEURS
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {selectedValues.map((v, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: C.primaryBg,
                borderRadius: 4,
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}
            >
              <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.primary }}>
                {i + 1}.
              </Text>
              <Text style={{ fontSize: 9, color: C.medium, fontFamily: 'Helvetica-Bold' }}>
                {v}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Inspiration figures */}
      {peopleExercise.length > 0 && (
        <View
          style={{
            backgroundColor: '#f9fafb',
            borderRadius: 6,
            padding: 10,
            borderWidth: 1,
            borderColor: C.lightGray,
          }}
        >
          <Text
            style={{
              fontSize: 8,
              fontFamily: 'Helvetica-Bold',
              color: C.gray,
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            FIGURES D'INSPIRATION
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {peopleExercise.slice(0, 6).map((p, i) => (
              <View
                key={i}
                style={{
                  width: '31%',
                  backgroundColor: C.white,
                  borderRadius: 4,
                  padding: 7,
                  borderWidth: 1,
                  borderColor: C.lightGray,
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontFamily: 'Helvetica-Bold',
                    color: C.dark,
                    marginBottom: 2,
                  }}
                >
                  {p?.name?.trim() || `Personne ${i + 1}`}
                </Text>
                <Text style={{ fontSize: 8, color: C.gray, lineHeight: 1.4 }}>
                  {p?.values?.trim() || '—'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  )
}

// ─── PERSONALITY ─────────────────────────────────────────────────────────────

function PersonalityChart({ data }: { data: unknown }) {
  const d = safeObj(data)
  const BAR_WIDTH = 180

  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {PERSONALITY_FIELDS.map(({ key, label }) => {
          const value = Math.min(10, Math.max(0, safeNum(d[key])))
          const filled = Math.round((value / 10) * BAR_WIDTH)
          return (
            <View key={key} style={{ width: '47%' }}>
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}
              >
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.dark }}>
                  {label}
                </Text>
                <Text style={{ fontSize: 9, color: C.gray }}>{value}/10</Text>
              </View>
              <View style={{ height: 8, backgroundColor: C.lightGray, borderRadius: 4 }}>
                <View
                  style={{ width: filled, height: 8, backgroundColor: '#f59e0b', borderRadius: 4 }}
                />
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}

// ─── LIFE_CURVE ───────────────────────────────────────────────────────────────

function LifeCurveChart({ data }: { data: unknown }) {
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

  const polyline = points.map((p) => `${toX(p.year)},${toY(p.satisfaction)}`).join(' ')
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
          <SvgPolyline points={polyline} fill="none" stroke={C.primary} strokeWidth={2} />

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

// ─── DISC ─────────────────────────────────────────────────────────────────────

type DiscScoresPdf = Record<DiscWheelTrait, number>

/** Radar resserré autour des scores (même domaine que le dashboard), D en haut à droite. */
function DiscRadar({ scores }: { scores: DiscScoresPdf }) {
  const SIZE = 160
  const CX = SIZE / 2
  const CY = SIZE / 2
  const R_MAX = 58
  const domain = discRadarDomain(scores)
  const ticks = discRadarTicks(domain)

  const pointFor = (trait: DiscWheelTrait, ratio: number) =>
    polarToXY(CX, CY, ratio * R_MAX, DISC_WHEEL_TRAIT_ANGLES[trait])

  const radarPoints = DISC_WHEEL_TRAITS.map((t) => {
    const pt = pointFor(t, discRadarRatio(scores[t], domain))
    return `${pt.x},${pt.y}`
  }).join(' ')

  return (
    <View style={{ width: SIZE, alignItems: 'center' }}>
      <Svg width={SIZE} height={SIZE}>
        {ticks.map((tick) => {
          const r = discRadarRatio(tick, domain) * R_MAX
          return (
            <SvgCircle
              key={tick}
              cx={CX}
              cy={CY}
              r={Math.max(0.5, r)}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={tick === domain[1] ? 1 : 0.5}
            />
          )
        })}
        {ticks.slice(1).map((tick) => (
          <SvgText
            key={`tick-${tick}`}
            x={CX + 2}
            y={CY - discRadarRatio(tick, domain) * R_MAX - 1}
            style={{ fontSize: 5 }}
            fill={C.medium}
          >
            {tick} %
          </SvgText>
        ))}
        {DISC_WHEEL_TRAITS.map((t) => {
          const pt = pointFor(t, 1)
          return (
            <SvgLine
              key={t}
              x1={CX}
              y1={CY}
              x2={pt.x}
              y2={pt.y}
              stroke="#e5e7eb"
              strokeWidth={0.5}
            />
          )
        })}
        <SvgPolygon
          points={radarPoints}
          fill={DISC_COLORS.I.bar}
          fillOpacity={0.35}
          stroke={C.dark}
          strokeWidth={1.2}
        />
        {DISC_WHEEL_TRAITS.map((t) => {
          const label = pointFor(t, 1.22)
          const dot = pointFor(t, discRadarRatio(scores[t], domain))
          return (
            <Fragment key={t}>
              <SvgCircle cx={label.x} cy={label.y} r={8} fill={DISC_COLORS[t].bg} />
              <SvgText
                x={label.x}
                y={label.y + 3}
                textAnchor="middle"
                style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}
                fill={DISC_COLORS[t].ink}
              >
                {t}
              </SvgText>
              <SvgCircle
                cx={dot.x}
                cy={dot.y}
                r={3}
                fill={DISC_COLORS[t].bar}
                stroke="#ffffff"
                strokeWidth={1}
              />
            </Fragment>
          )
        })}
      </Svg>
      <Text style={{ fontSize: 7, color: C.medium, marginTop: 2 }}>
        Échelle resserrée : {domain[0]} à {domain[1]} %
      </Text>
    </View>
  )
}

/** Roue DISC statique : huit zones, anneaux d'intensité et point du candidat. */
function DiscWheelPdf({ scores }: { scores: DiscScoresPdf }) {
  const WIDTH = 250
  const HEIGHT = 190
  const CX = WIDTH / 2
  const CY = HEIGHT / 2
  const R = 66
  const ringRadii = DISC_WHEEL_RINGS.map((ring) => ring.to * R)
  const ringOpacity = [0.35, 0.6, 0.9]
  const position = discWheelPosition(scores)
  const point = discWheelPoint(position, CX, CY, R)

  return (
    <Svg width={WIDTH} height={HEIGHT}>
      <SvgDefs>
        {DISC_WHEEL_ZONES.filter((zone) => zone.traits.length === 2).map((zone) => {
          const { start, end } = discWheelZoneBounds(zone)
          const from = polarToXY(CX, CY, R, start)
          const to = polarToXY(CX, CY, R, end)
          const [first, second] = zone.traits
          return (
            <SvgLinearGradient
              key={zone.key}
              id={`disc-pdf-${zone.key}`}
              gradientUnits="userSpaceOnUse"
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
            >
              <SvgStop offset="0%" stopColor={DISC_COLORS[first].bar} />
              <SvgStop offset="100%" stopColor={DISC_COLORS[second ?? first].bar} />
            </SvgLinearGradient>
          )
        })}
      </SvgDefs>

      {DISC_WHEEL_ZONES.flatMap((zone) => {
        const { start, end } = discWheelZoneBounds(zone)
        const fill =
          zone.traits.length === 1 ? DISC_COLORS[zone.traits[0]].bar : `url(#disc-pdf-${zone.key})`
        return ringOpacity.map((opacity, index) => (
          <SvgPath
            key={`${zone.key}-${index}`}
            d={sectorPath(CX, CY, ringRadii[index], ringRadii[index + 1], start, end)}
            fill={fill}
            fillOpacity={opacity}
            stroke="#ffffff"
            strokeWidth={1}
          />
        ))
      })}

      <SvgCircle
        cx={CX}
        cy={CY}
        r={ringRadii[0]}
        fill="#ffffff"
        stroke="#e5e7eb"
        strokeWidth={0.8}
      />

      {DISC_WHEEL_ZONES.map((zone) => {
        const sin = Math.sin((zone.angle * Math.PI) / 180)
        const cos = Math.cos((zone.angle * Math.PI) / 180)
        const at = polarToXY(CX, CY, R + 6, zone.angle)
        const anchor = Math.abs(sin) < 0.2 ? 'middle' : sin > 0 ? 'start' : 'end'
        const dy = Math.abs(sin) < 0.2 ? (cos > 0 ? -2 : 7) : 3
        const isCandidate = zone.key === position.zone?.key
        return (
          <SvgText
            key={zone.key}
            x={at.x}
            y={at.y + dy}
            textAnchor={anchor}
            style={{ fontSize: 7, fontFamily: 'Helvetica-Bold' }}
            fill={isCandidate ? C.primary : C.dark}
          >
            {zone.label}
          </SvgText>
        )
      })}

      {DISC_WHEEL_TRAITS.map((trait) => {
        const at = polarToXY(
          CX,
          CY,
          (ringRadii[0] + ringRadii[1]) / 2,
          DISC_WHEEL_TRAIT_ANGLES[trait]
        )
        return (
          <Fragment key={trait}>
            <SvgCircle cx={at.x} cy={at.y} r={5} fill="#ffffff" />
            <SvgText
              x={at.x}
              y={at.y + 2}
              textAnchor="middle"
              style={{ fontSize: 5.5, fontFamily: 'Helvetica-Bold' }}
              fill={C.dark}
            >
              {trait}
            </SvgText>
          </Fragment>
        )
      })}

      <SvgCircle cx={point.x} cy={point.y} r={8} fill={C.dark} fillOpacity={0.15} />
      <SvgCircle cx={point.x} cy={point.y} r={4} fill={C.dark} stroke="#ffffff" strokeWidth={1.5} />
    </Svg>
  )
}

function DiscChart({ data }: { data: unknown }) {
  const d = safeObj(data)
  const scores: DiscScoresPdf = {
    D: Math.min(100, Math.max(0, safeNum(d.D))),
    I: Math.min(100, Math.max(0, safeNum(d.I))),
    S: Math.min(100, Math.max(0, safeNum(d.S))),
    C: Math.min(100, Math.max(0, safeNum(d.C))),
  }

  // Dominant trait
  const dominant = (Object.entries(scores) as Array<[DiscWheelTrait, number]>).sort(
    (a, b) => b[1] - a[1]
  )[0][0]
  const position = discWheelPosition(scores)

  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
        {/* Left: bars */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 8,
              fontFamily: 'Helvetica-Bold',
              color: C.primary,
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            DOMINANT : {DISC_COLORS[dominant].label.toUpperCase()} ({dominant})
          </Text>
          {DISC_WHEEL_TRAITS.map((trait) => {
            const value = scores[trait]
            const color = DISC_COLORS[trait]
            const barW = Math.round((value / 100) * 220)
            return (
              <View key={trait} style={{ marginBottom: 8 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        backgroundColor: color.bg,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: color.ink }}>
                        {trait}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 9, color: C.medium }}>{color.label}</Text>
                  </View>
                  <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: color.ink }}>
                    {value}%
                  </Text>
                </View>
                <View style={{ height: 8, backgroundColor: C.lightGray, borderRadius: 4 }}>
                  <View
                    style={{ width: barW, height: 8, backgroundColor: color.bar, borderRadius: 4 }}
                  />
                </View>
              </View>
            )
          })}
        </View>

        {/* Right: radar */}
        <DiscRadar scores={scores} />
      </View>

      {/* Roue DISC */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <DiscWheelPdf scores={scores} />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 8,
              fontFamily: 'Helvetica-Bold',
              color: C.primary,
              letterSpacing: 1,
              marginBottom: 4,
            }}
          >
            POSITION SUR LA ROUE
          </Text>
          {position.zone ? (
            <>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.dark }}>
                Zone {position.zone.label} (tendance {position.ring.label})
              </Text>
              <Text style={{ fontSize: 8.5, color: C.medium, marginTop: 3, lineHeight: 1.4 }}>
                {position.zone.description}
              </Text>
              <Text style={{ fontSize: 7.5, color: C.medium, marginTop: 3 }}>
                {position.zone.keywords.join(' · ')}
              </Text>
            </>
          ) : (
            <Text style={{ fontSize: 9, color: C.medium }}>
              Profil équilibré : aucun style ne domine.
            </Text>
          )}
          <Text style={{ fontSize: 7, color: C.medium, marginTop: 6 }}>
            Plus le point est loin du centre, plus le style est marqué.
          </Text>
        </View>
      </View>
    </View>
  )
}

// ─── CIRCLE_OF_CONTROL ────────────────────────────────────────────────────────

function CircleOfControlChart({ data }: { data: unknown }) {
  const d = safeObj(data)
  const inControl = safeArr(d.inControl) as string[]
  const outControl = safeArr(d.outControl) as string[]

  if (inControl.length === 0 && outControl.length === 0) return null

  const Pill = ({ text, color, bg }: { text: string; color: string; bg: string }) => (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 4,
        paddingHorizontal: 7,
        paddingVertical: 3,
        margin: 2,
      }}
    >
      <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color }}>{text}</Text>
    </View>
  )

  return (
    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
      {/* In control */}
      <View
        style={{
          flex: 1,
          backgroundColor: '#f5f3ff',
          borderRadius: 6,
          padding: 10,
          borderWidth: 1,
          borderColor: '#ddd6fe',
        }}
      >
        <Text
          style={{
            fontSize: 8,
            fontFamily: 'Helvetica-Bold',
            color: C.primary,
            letterSpacing: 1,
            marginBottom: 8,
          }}
        >
          SOUS CONTRÔLE
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {inControl.map((item, i) => (
            <Pill key={i} text={item} color={C.primaryDark} bg={C.white} />
          ))}
        </View>
      </View>

      {/* Out of control */}
      <View
        style={{
          flex: 1,
          backgroundColor: '#fff1f2',
          borderRadius: 6,
          padding: 10,
          borderWidth: 1,
          borderColor: '#fecdd3',
        }}
      >
        <Text
          style={{
            fontSize: 8,
            fontFamily: 'Helvetica-Bold',
            color: '#e11d48',
            letterSpacing: 1,
            marginBottom: 8,
          }}
        >
          HORS CONTRÔLE
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {outControl.map((item, i) => (
            <Pill key={i} text={item} color="#e11d48" bg={C.white} />
          ))}
        </View>
      </View>
    </View>
  )
}

// ─── SKILL_MAPPING ────────────────────────────────────────────────────────────

function SkillMappingChart({ data }: { data: unknown }) {
  const d = safeObj(data)
  const jobTitle = String(d.jobTitle || '')
  const mapping = safeArr(d.mapping) as Array<{
    mission?: string
    activity?: string
    proof?: string
  }>

  if (mapping.length === 0) return null

  const COL = { mission: '35%', activity: '35%', proof: '30%' } as const

  return (
    <View style={{ marginBottom: 8 }}>
      {jobTitle && (
        <View style={{ backgroundColor: C.primary, borderRadius: 4, padding: 8, marginBottom: 6 }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.white }}>
            {jobTitle}
          </Text>
        </View>
      )}
      {/* Header row */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: C.primaryBg,
          borderRadius: 4,
          paddingHorizontal: 8,
          paddingVertical: 5,
          marginBottom: 2,
        }}
      >
        {(['Mission', 'Activité', 'Preuve'] as const).map((h, i) => (
          <Text
            key={i}
            style={{
              fontSize: 8,
              fontFamily: 'Helvetica-Bold',
              color: C.primary,
              width: Object.values(COL)[i],
            }}
          >
            {h}
          </Text>
        ))}
      </View>
      {/* Rows */}
      {mapping.map((row, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            paddingHorizontal: 8,
            paddingVertical: 5,
            backgroundColor: i % 2 === 0 ? C.white : C.superLight,
            borderRadius: 2,
          }}
        >
          <Text style={{ fontSize: 8, color: C.medium, width: COL.mission, lineHeight: 1.4 }}>
            {row.mission || '—'}
          </Text>
          <Text style={{ fontSize: 8, color: C.medium, width: COL.activity, lineHeight: 1.4 }}>
            {row.activity || '—'}
          </Text>
          <Text style={{ fontSize: 8, color: C.gray, width: COL.proof, lineHeight: 1.4 }}>
            {row.proof || '—'}
          </Text>
        </View>
      ))}
    </View>
  )
}

// ─── TARGETING ────────────────────────────────────────────────────────────────

function TargetingChart({ data }: { data: unknown }) {
  const d = safeObj(data)
  const targets = safeArr(d.targets) as Array<{
    name?: string
    type?: string
    comment?: string
    advisorComment?: string
  }>

  if (targets.length === 0) return null

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
      {targets.map((t, i) => (
        <View
          key={i}
          style={{
            width: '47%',
            backgroundColor: C.superLight,
            borderRadius: 6,
            padding: 10,
            borderWidth: 1,
            borderColor: C.lightGray,
          }}
        >
          <Text
            style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.dark, marginBottom: 2 }}
          >
            {t.name || `Cible ${i + 1}`}
          </Text>
          {t.type && (
            <View
              style={{
                backgroundColor: C.primaryBg,
                borderRadius: 3,
                paddingHorizontal: 6,
                paddingVertical: 2,
                alignSelf: 'flex-start',
                marginBottom: 4,
              }}
            >
              <Text style={{ fontSize: 8, color: C.primary, fontFamily: 'Helvetica-Bold' }}>
                {t.type}
              </Text>
            </View>
          )}
          {t.comment && (
            <Text style={{ fontSize: 8, color: C.medium, lineHeight: 1.4, marginBottom: 2 }}>
              {t.comment}
            </Text>
          )}
          {t.advisorComment && (
            <Text style={{ fontSize: 8, color: C.gray, lineHeight: 1.4 }}>{t.advisorComment}</Text>
          )}
        </View>
      ))}
    </View>
  )
}

// ─── MAIN DISPATCHER ──────────────────────────────────────────────────────────

export function ExerciseChart({ type, data }: { type: string; data: unknown }) {
  switch (type) {
    case 'MOTIVATION':
      return <MotivationChart data={data} />
    case 'VALUES':
      return <ValuesChart data={data} />
    case 'PERSONALITY':
      return <PersonalityChart data={data} />
    case 'LIFE_CURVE':
      return <LifeCurveChart data={data} />
    case 'DISC':
      return <DiscChart data={data} />
    case 'CIRCLE_OF_CONTROL':
      return <CircleOfControlChart data={data} />
    case 'SKILL_MAPPING':
      return <SkillMappingChart data={data} />
    case 'TARGETING':
      return <TargetingChart data={data} />
    default:
      return null
  }
}

/** Types with a dedicated chart — ScoreBlock is skipped for these */
export const TYPES_WITH_CHART = new Set([
  'MOTIVATION',
  'VALUES',
  'PERSONALITY',
  'LIFE_CURVE',
  'DISC',
  'CIRCLE_OF_CONTROL',
  'SKILL_MAPPING',
  'TARGETING',
])
