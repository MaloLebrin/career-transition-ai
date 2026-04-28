import {
  Circle as SvgCircle,
  Line as SvgLine,
  Polygon as SvgPolygon,
  Polyline as SvgPolyline,
  Svg,
  Text as _SvgText,
} from '@react-pdf/renderer'

// react-pdf SVG Text has a type gap with fontSize + textAnchor — cast to bypass
const SvgText = _SvgText as any
import { Text, View } from '@react-pdf/renderer'
import { C } from './styles.js'

// ─── DISC colors (mirror prod) ────────────────────────────────────────────────

const DISC_COLORS = {
  D: { bar: '#ef4444', bg: '#fee2e2', label: 'Dominant' },
  I: { bar: '#f59e0b', bg: '#fef3c7', label: 'Influent' },
  S: { bar: '#10b981', bg: '#d1fae5', label: 'Stable' },
  C: { bar: '#0ea5e9', bg: '#e0f2fe', label: 'Consciencieux' },
} as const

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
  const ranked = safeArr(d.ranked) as string[]
  const top3 = ranked.slice(0, 3)
  const bottom3 = [...ranked].reverse().slice(0, 3)

  if (ranked.length === 0) return null

  return (
    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
      {/* Top 3 */}
      <View style={{ flex: 1, backgroundColor: '#f0fdf4', borderRadius: 6, padding: 10, borderWidth: 1, borderColor: '#bbf7d0' }}>
        <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#16a34a', letterSpacing: 1, marginBottom: 8 }}>
          TOP 3 — LEVIERS D'ENGAGEMENT
        </Text>
        {top3.map((item, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 9, color: '#fff', fontFamily: 'Helvetica-Bold' }}>{i + 1}</Text>
            </View>
            <Text style={{ fontSize: 9, color: '#374151', fontFamily: 'Helvetica-Bold', flex: 1 }}>{item}</Text>
          </View>
        ))}
      </View>

      {/* Bottom 3 */}
      <View style={{ flex: 1, backgroundColor: '#fff1f2', borderRadius: 6, padding: 10, borderWidth: 1, borderColor: '#fecdd3' }}>
        <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#e11d48', letterSpacing: 1, marginBottom: 8 }}>
          FACTEURS DE DÉSENGAGEMENT
        </Text>
        {bottom3.map((item, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#e11d48', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 9, color: '#fff', fontFamily: 'Helvetica-Bold' }}>{i + 1}</Text>
            </View>
            <Text style={{ fontSize: 9, color: '#374151', flex: 1 }}>{item}</Text>
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
      <View style={{ backgroundColor: '#f9fafb', borderRadius: 6, padding: 10, borderWidth: 1, borderColor: C.lightGray, marginBottom: 8 }}>
        <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.gray, letterSpacing: 1, marginBottom: 8 }}>
          HIÉRARCHIE DES VALEURS
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {selectedValues.map((v, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.primaryBg, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.primary }}>{i + 1}.</Text>
              <Text style={{ fontSize: 9, color: C.medium, fontFamily: 'Helvetica-Bold' }}>{v}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Inspiration figures */}
      {peopleExercise.length > 0 && (
        <View style={{ backgroundColor: '#f9fafb', borderRadius: 6, padding: 10, borderWidth: 1, borderColor: C.lightGray }}>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.gray, letterSpacing: 1, marginBottom: 8 }}>
            FIGURES D'INSPIRATION
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {peopleExercise.slice(0, 6).map((p, i) => (
              <View key={i} style={{ width: '31%', backgroundColor: C.white, borderRadius: 4, padding: 7, borderWidth: 1, borderColor: C.lightGray }}>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.dark, marginBottom: 2 }}>
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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.dark }}>{label}</Text>
                <Text style={{ fontSize: 9, color: C.gray }}>{value}/10</Text>
              </View>
              <View style={{ height: 8, backgroundColor: C.lightGray, borderRadius: 4 }}>
                <View style={{ width: filled, height: 8, backgroundColor: '#f59e0b', borderRadius: 4 }} />
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
      <View style={{ backgroundColor: '#f8fafc', borderRadius: 6, padding: 8, borderWidth: 1, borderColor: C.lightGray, marginBottom: 8 }}>
        <Svg width={W} height={H}>
          {/* Y-axis labels */}
          <SvgText x={0} y={PT + 3} fontSize={7} fill={C.gray}>10</SvgText>
          <SvgText x={2} y={midY + 3} fontSize={7} fill={C.gray}>5</SvgText>
          <SvgText x={4} y={PT + iH + 3} fontSize={7} fill={C.gray}>0</SvgText>

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
          <SvgLine x1={PL} y1={PT + iH} x2={W - PR} y2={PT + iH} stroke={C.lightGray} strokeWidth={0.5} />

          {/* Year labels (max 10) */}
          {points
            .filter((_, i) => i % Math.max(1, Math.floor(points.length / 10)) === 0 || i === points.length - 1)
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
            <View key={key} style={{ width: '47%', backgroundColor: C.white, borderRadius: 4, padding: 8, borderWidth: 1, borderColor: C.lightGray }}>
              <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.gray, letterSpacing: 0.5, marginBottom: 3 }}>
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

function DiscChart({ data }: { data: unknown }) {
  const d = safeObj(data)
  const scores = {
    D: Math.min(100, Math.max(0, safeNum(d.D))),
    I: Math.min(100, Math.max(0, safeNum(d.I))),
    S: Math.min(100, Math.max(0, safeNum(d.S))),
    C: Math.min(100, Math.max(0, safeNum(d.C))),
  }

  // Radar SVG config
  const CX = 80
  const CY = 80
  const R_MAX = 62
  const SVG_SIZE = 160

  const axisPoint = (trait: 'D' | 'I' | 'S' | 'C', r: number) => {
    switch (trait) {
      case 'D': return { x: CX, y: CY - r }
      case 'I': return { x: CX + r, y: CY }
      case 'S': return { x: CX, y: CY + r }
      case 'C': return { x: CX - r, y: CY }
    }
  }

  const radarPoints = (['D', 'I', 'S', 'C'] as const)
    .map((t) => {
      const pt = axisPoint(t, (scores[t] / 100) * R_MAX)
      return `${pt.x},${pt.y}`
    })
    .join(' ')

  const gridLevels = [25, 50, 75, 100]

  // Dominant trait
  const dominant = (Object.entries(scores) as Array<[keyof typeof scores, number]>)
    .sort((a, b) => b[1] - a[1])[0][0]

  return (
    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
      {/* Left: bars */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.primary, letterSpacing: 1, marginBottom: 8 }}>
          DOMINANT : {DISC_COLORS[dominant].label.toUpperCase()} ({dominant})
        </Text>
        {(['D', 'I', 'S', 'C'] as const).map((trait) => {
          const value = scores[trait]
          const color = DISC_COLORS[trait]
          const barW = Math.round((value / 100) * 220)
          return (
            <View key={trait} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: color.bg, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: color.bar }}>{trait}</Text>
                  </View>
                  <Text style={{ fontSize: 9, color: C.medium }}>{color.label}</Text>
                </View>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: color.bar }}>{value}%</Text>
              </View>
              <View style={{ height: 8, backgroundColor: C.lightGray, borderRadius: 4 }}>
                <View style={{ width: barW, height: 8, backgroundColor: color.bar, borderRadius: 4 }} />
              </View>
            </View>
          )
        })}
      </View>

      {/* Right: radar diamond */}
      <View style={{ width: SVG_SIZE, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={SVG_SIZE} height={SVG_SIZE}>
          {/* Grid diamonds */}
          {gridLevels.map((pct) => {
            const r = (pct / 100) * R_MAX
            const pts = (['D', 'I', 'S', 'C'] as const)
              .map((t) => {
                const p = axisPoint(t, r)
                return `${p.x},${p.y}`
              })
              .join(' ')
            return (
              <SvgPolygon
                key={pct}
                points={pts}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth={pct === 100 ? 1 : 0.5}
              />
            )
          })}

          {/* Axes */}
          {(['D', 'I', 'S', 'C'] as const).map((t) => {
            const pt = axisPoint(t, R_MAX)
            return (
              <SvgLine key={t} x1={CX} y1={CY} x2={pt.x} y2={pt.y} stroke="#e5e7eb" strokeWidth={0.5} />
            )
          })}

          {/* Filled radar polygon */}
          <SvgPolygon points={radarPoints} fill={C.primary} fillOpacity={0.25} stroke={C.primary} strokeWidth={1.5} />

          {/* Axis letter labels at the extremes using colored circles */}
          {(['D', 'I', 'S', 'C'] as const).map((t) => {
            const pt = axisPoint(t, R_MAX + 10)
            return (
              <SvgCircle key={`lbl-${t}`} cx={pt.x} cy={pt.y} r={8} fill={DISC_COLORS[t].bar} />
            )
          })}

          {/* Data point dots */}
          {(['D', 'I', 'S', 'C'] as const).map((t) => {
            const pt = axisPoint(t, (scores[t] / 100) * R_MAX)
            return <SvgCircle key={t} cx={pt.x} cy={pt.y} r={3} fill={DISC_COLORS[t].bar} />
          })}
        </Svg>
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
    <View style={{ backgroundColor: bg, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3, margin: 2 }}>
      <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color }}>{text}</Text>
    </View>
  )

  return (
    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
      {/* In control */}
      <View style={{ flex: 1, backgroundColor: '#f5f3ff', borderRadius: 6, padding: 10, borderWidth: 1, borderColor: '#ddd6fe' }}>
        <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.primary, letterSpacing: 1, marginBottom: 8 }}>
          SOUS CONTRÔLE
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {inControl.map((item, i) => (
            <Pill key={i} text={item} color={C.primaryDark} bg={C.white} />
          ))}
        </View>
      </View>

      {/* Out of control */}
      <View style={{ flex: 1, backgroundColor: '#fff1f2', borderRadius: 6, padding: 10, borderWidth: 1, borderColor: '#fecdd3' }}>
        <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#e11d48', letterSpacing: 1, marginBottom: 8 }}>
          HORS CONTRÔLE
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {outControl.map((item, i) => (
            <Pill key={i} text={item} color='#e11d48' bg={C.white} />
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
  const mapping = safeArr(d.mapping) as Array<{ mission?: string; activity?: string; proof?: string }>

  if (mapping.length === 0) return null

  const COL = { mission: '35%', activity: '35%', proof: '30%' } as const

  return (
    <View style={{ marginBottom: 8 }}>
      {jobTitle && (
        <View style={{ backgroundColor: C.primary, borderRadius: 4, padding: 8, marginBottom: 6 }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.white }}>{jobTitle}</Text>
        </View>
      )}
      {/* Header row */}
      <View style={{ flexDirection: 'row', backgroundColor: C.primaryBg, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 5, marginBottom: 2 }}>
        {(['Mission', 'Activité', 'Preuve'] as const).map((h, i) => (
          <Text key={i} style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.primary, width: Object.values(COL)[i] }}>
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
          <Text style={{ fontSize: 8, color: C.medium, width: COL.mission, lineHeight: 1.4 }}>{row.mission || '—'}</Text>
          <Text style={{ fontSize: 8, color: C.medium, width: COL.activity, lineHeight: 1.4 }}>{row.activity || '—'}</Text>
          <Text style={{ fontSize: 8, color: C.gray, width: COL.proof, lineHeight: 1.4 }}>{row.proof || '—'}</Text>
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
        <View key={i} style={{ width: '47%', backgroundColor: C.superLight, borderRadius: 6, padding: 10, borderWidth: 1, borderColor: C.lightGray }}>
          <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.dark, marginBottom: 2 }}>
            {t.name || `Cible ${i + 1}`}
          </Text>
          {t.type && (
            <View style={{ backgroundColor: C.primaryBg, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 4 }}>
              <Text style={{ fontSize: 8, color: C.primary, fontFamily: 'Helvetica-Bold' }}>{t.type}</Text>
            </View>
          )}
          {t.comment && (
            <Text style={{ fontSize: 8, color: C.medium, lineHeight: 1.4, marginBottom: 2 }}>{t.comment}</Text>
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
  'MOTIVATION', 'VALUES', 'PERSONALITY', 'LIFE_CURVE',
  'DISC', 'CIRCLE_OF_CONTROL', 'SKILL_MAPPING', 'TARGETING',
])
