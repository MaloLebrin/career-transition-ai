import { Text, View } from '@react-pdf/renderer'
import { APP_TIME_ZONE } from '#shared/helpers/date'
import { C, s } from './styles.js'

// ─── helpers ──────────────────────────────────────────────────────────────────

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: APP_TIME_ZONE,
  })
}

/**
 * Séparateur « poste actuel › poste visé ». Les polices standard du PDF
 * (Helvetica, encodage WinAnsi) n'ont pas de glyphe « → » : il sortait en « ' ».
 */
export const ROLE_SEPARATOR = ' › '

export function synthesisRoleText(employee: {
  currentRole: string
  targetRole?: string | null
}): string {
  const target = employee.targetRole?.trim()
  return target ? `${employee.currentRole}${ROLE_SEPARATOR}${target}` : employee.currentRole
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
