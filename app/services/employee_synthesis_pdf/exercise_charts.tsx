/**
 * Graphiques d'exercice du PDF de synthèse : un fichier par exercice dans `./charts/`,
 * ce module ne fait que choisir le graphique selon le type.
 */
import { MotivationChart } from './charts/motivation_chart.js'
import { ValuesChart } from './charts/values_chart.js'
import { PersonalityChart } from './charts/personality_chart.js'
import { LifeCurveChart } from './charts/life_curve_chart.js'
import { DiscChart } from './charts/disc_chart.js'
import { CircleOfControlChart } from './charts/circle_of_control_chart.js'
import { SkillMappingChart } from './charts/skill_mapping_chart.js'
import { TargetingChart } from './charts/targeting_chart.js'

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
