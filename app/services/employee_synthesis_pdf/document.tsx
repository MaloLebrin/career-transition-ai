import { Document, Page, Text, View } from '@react-pdf/renderer'
import type { EmployeeSynthesisPayload } from '#services/employee_synthesis_service'
import { Footer, ScoreBlock, SectionTitle, SkillBar, SubLabel, formatDate } from './components.js'
import { ExerciseChart, TYPES_WITH_CHART } from './exercise_charts.js'
import { s } from './styles.js'

export type SynthesisPdfProps = Omit<EmployeeSynthesisPayload, 'synthesis'> & {
  synthesis: Omit<EmployeeSynthesisPayload['synthesis'], 'expertNotesInternal'>
}

// ─── exercise labels ──────────────────────────────────────────────────────────

const EXERCISE_LABELS: Record<string, string> = {
  MOTIVATION: 'Analyse Motivations',
  VALUES: 'Recherche de Valeurs',
  PERSONALITY: 'Personnalité',
  COMPETENCIES: 'Compétences',
  LIFE_CURVE: 'Courbe de vie',
  CV_ANALYSIS: 'Analyse CV',
  TARGETING: 'Ciblage',
  DISC: 'DISC',
  CIRCLE_OF_CONTROL: "Cercle de contrôle",
  SKILL_MAPPING: 'Cartographie des compétences',
}

// ─── document ─────────────────────────────────────────────────────────────────

export function SynthesisPdfDocument({ employee, synthesis, latestCompletedByType }: SynthesisPdfProps) {
  const generationDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const roleText = employee.currentRole + (employee.targetRole ? ` → ${employee.targetRole}` : '')

  const latestIds = new Set(Object.values(latestCompletedByType))
  const exercisesToShow = employee.exercises
    .filter((ex) => latestIds.has(ex.id))
    .sort((a, b) => (b.date > a.date ? 1 : -1))

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ─── Page header ─────────────────────────────────────────────────── */}
        <View style={s.pageHeader}>
          <Text style={s.pageHeaderEyebrow}>DOSSIER DE SYNTHÈSE</Text>
          <Text style={s.pageHeaderName}>{employee.name}</Text>
          <View style={s.pageHeaderRoleRow}>
            <Text style={s.pageHeaderRole}>{roleText}</Text>
            {synthesis.sharedAt && (
              <Text style={s.pageHeaderDate}>{formatDate(synthesis.sharedAt)}</Text>
            )}
          </View>
          <Text style={s.pageHeaderEmail}>{employee.email}</Text>
        </View>

        {/* ─── Résumé exécutif ─────────────────────────────────────────────── */}
        {synthesis.executiveSummaryOverride?.trim() && (
          <View style={s.sectionBlock}>
            <SectionTitle label="Résumé exécutif" />
            <View style={s.highlight}>
              <Text style={s.highlightText}>{synthesis.executiveSummaryOverride}</Text>
            </View>
          </View>
        )}

        {/* ─── Message de l'expert ─────────────────────────────────────────── */}
        {synthesis.expertCommentsShared?.trim() && (
          <View style={s.sectionBlock}>
            <SectionTitle label="Message de l'expert" />
            <View style={s.highlight}>
              <Text style={s.highlightText}>{synthesis.expertCommentsShared}</Text>
            </View>
          </View>
        )}

        {/* ─── Profil ──────────────────────────────────────────────────────── */}
        <View style={s.sectionBlock}>
          <SectionTitle label="Profil" />
          <View style={s.card}>
            <Text style={s.profileName}>{employee.name}</Text>
            <Text style={s.profileRole}>{roleText}</Text>
            <Text style={s.profileEmail}>{employee.email}</Text>
            {employee.summary?.trim() && (
              <>
                <View style={s.profileDivider} />
                <Text style={s.profileSummary}>{employee.summary}</Text>
              </>
            )}
          </View>
        </View>

        {/* ─── Expériences professionnelles ────────────────────────────────── */}
        {employee.experiences.length > 0 && (
          <View style={s.sectionBlock}>
            <SectionTitle label="Expériences professionnelles" />
            {employee.experiences.map((exp) => {
              const datePart = exp.endDate
                ? `${exp.startDate} – ${exp.endDate}`
                : exp.startDate + (exp.isCurrent ? ' – à ce jour' : '')
              const meta = [exp.company, exp.type, datePart].filter(Boolean).join('  ·  ')
              return (
                <View key={exp.id} style={s.card} wrap={false}>
                  <SubLabel label={exp.title} />
                  <Text style={s.bodySmall}>{meta}</Text>
                  {exp.description?.trim() && (
                    <Text style={[s.body, { marginTop: 4 }]}>{exp.description}</Text>
                  )}
                </View>
              )
            })}
          </View>
        )}

        {/* ─── Formations ──────────────────────────────────────────────────── */}
        {employee.educations.length > 0 && (
          <View style={s.sectionBlock}>
            <SectionTitle label="Formations" />
            {employee.educations.map((edu) => {
              const datePart = edu.endDate
                ? `${edu.startDate} – ${edu.endDate}`
                : edu.startDate + (edu.isCurrent ? ' – en cours' : '')
              return (
                <View key={edu.id} style={s.card} wrap={false}>
                  <SubLabel label={edu.degree} />
                  <Text style={s.bodySmall}>{edu.school}  ·  {datePart}</Text>
                  {edu.description?.trim() && (
                    <Text style={[s.body, { marginTop: 4 }]}>{edu.description}</Text>
                  )}
                </View>
              )
            })}
          </View>
        )}

        {/* ─── Compétences ─────────────────────────────────────────────────── */}
        {employee.skills.length > 0 && (
          <View style={s.sectionBlock}>
            <SectionTitle label="Compétences" />
            <View style={s.card}>
              {employee.skills.map((skill, i) => (
                <View key={i} style={s.skillRow}>
                  <Text style={s.skillName}>{skill.name}</Text>
                  <SkillBar level={skill.level} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ─── Résultats des exercices ─────────────────────────────────────── */}
        {exercisesToShow.length > 0 && (
          <View style={s.sectionBlock}>
            <SectionTitle label="Résultats des exercices" />
            {exercisesToShow.map((ex) => {
              const label = EXERCISE_LABELS[ex.type] ?? ex.type
              const metaParts: string[] = []
              if (ex.date) metaParts.push(formatDate(ex.date))
              if (ex.duration) metaParts.push(`${ex.duration} min`)

              return (
                <View key={ex.id} style={s.exerciseCard} wrap={false}>
                  {/* Header */}
                  <View style={s.exerciseCardHeader}>
                    <Text style={s.exerciseCardTitle}>{label}</Text>
                    {metaParts.length > 0 && (
                      <View style={s.exerciseTypePill}>
                        <Text style={s.exerciseTypePillText}>{metaParts.join(' · ')}</Text>
                      </View>
                    )}
                  </View>

                  {/* Body */}
                  <View style={s.exerciseCardBody}>
                    {/* Type-specific chart */}
                    <ExerciseChart type={ex.type} data={ex.data} />

                    {/* Generic score block (fallback for types without a specific chart) */}
                    {ex.quantitativeScore > 0 && !TYPES_WITH_CHART.has(ex.type) && (
                      <ScoreBlock score={ex.quantitativeScore} max={10} />
                    )}

                    {/* Qualitative analysis */}
                    {ex.qualitativeAnalysis?.trim() && (
                      <View style={s.analysisBox}>
                        <Text style={s.analysisEyebrow}>CONCLUSIONS &amp; ANALYSE</Text>
                        <Text style={s.analysisText}>{ex.qualitativeAnalysis}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )
            })}
          </View>
        )}

        <Footer generationDate={generationDate} />
      </Page>
    </Document>
  )
}
