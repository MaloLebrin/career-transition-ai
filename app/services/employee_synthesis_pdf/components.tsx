import { Text, View } from '@react-pdf/renderer'
import { C, s } from './styles.js'

// ─── helpers ──────────────────────────────────────────────────────────────────

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function getScoreColor(score: number, max = 10): string {
  const pct = score / max
  if (pct >= 0.7) return C.green
  if (pct >= 0.4) return C.amber
  return C.red
}

export function getScoreLabel(score: number, max = 10): string {
  const pct = score / max
  if (pct >= 0.7) return 'Très satisfaisant'
  if (pct >= 0.5) return 'Satisfaisant'
  if (pct >= 0.3) return 'En développement'
  return 'À travailler'
}

// ─── SectionTitle ─────────────────────────────────────────────────────────────

export function SectionTitle({ label }: { label: string }) {
  return <Text style={s.sectionTitle}>{label}</Text>
}

// ─── SubLabel ─────────────────────────────────────────────────────────────────

export function SubLabel({ label, underline = true }: { label: string; underline?: boolean }) {
  return <Text style={underline ? s.subLabel : s.subLabelPlain}>{label}</Text>
}

// ─── SkillBar ─────────────────────────────────────────────────────────────────

export function SkillBar({ level, max = 5 }: { level: number; max?: number }) {
  const filled = Math.min(max, Math.max(0, Math.round(level)))
  return (
    <View style={s.skillDots}>
      {Array.from({ length: max }, (_, i) => (
        <View
          key={i}
          style={{
            width: 14,
            height: 8,
            borderRadius: 2,
            backgroundColor: i < filled ? C.primary : C.lightGray,
          }}
        />
      ))}
    </View>
  )
}

// ─── ScoreBlock ───────────────────────────────────────────────────────────────

export function ScoreBlock({ score, max = 10 }: { score: number; max?: number }) {
  const filled = Math.min(max, Math.max(0, Math.round(score)))
  const empty = max - filled
  const color = getScoreColor(score, max)
  const label = getScoreLabel(score, max)

  return (
    <View style={s.scoreBlock}>
      {/* Big number */}
      <View style={{ alignItems: 'center' }}>
        <Text style={[s.scoreValue, { color }]}>{score}</Text>
        <Text style={s.bodySmall}>/{max}</Text>
      </View>

      {/* Bar + label */}
      <View style={s.scoreRight}>
        <View style={s.scoreBarTrack}>
          {Array.from({ length: filled }, (_, i) => (
            <View
              key={`f-${i}`}
              style={{ width: 18, height: 12, borderRadius: 3, backgroundColor: color }}
            />
          ))}
          {Array.from({ length: empty }, (_, i) => (
            <View
              key={`e-${i}`}
              style={{ width: 18, height: 12, borderRadius: 3, backgroundColor: C.lightGray }}
            />
          ))}
        </View>
        <Text style={[s.scoreBarLabel, { color }]}>{label}</Text>
      </View>
    </View>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

export function Footer({ generationDate }: { generationDate: string }) {
  return (
    <View style={s.footer} fixed>
      <View style={s.footerLine} />
      <View style={s.footerRow}>
        <Text style={s.footerText}>Document partageable — notes internes exclues</Text>
        <Text style={s.footerText}>Généré le {generationDate}</Text>
        <Text
          style={s.footerText}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber}/${totalPages}`}
        />
      </View>
    </View>
  )
}
