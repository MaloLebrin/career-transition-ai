import { EXERCICE_RESULTS_TYPES } from '#shared/constants/exercises'
import {
  Brain,
  CircleDot,
  Flame,
  Gem,
  Network,
  PieChart,
  Target,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

/** Icône de chaque exercice sur les pages marketing (catalogue, mockups). */
export const EXERCISE_ICONS: Record<string, LucideIcon> = {
  [EXERCICE_RESULTS_TYPES.MOTIVATION]: Flame,
  [EXERCICE_RESULTS_TYPES.VALUES]: Gem,
  [EXERCICE_RESULTS_TYPES.LIFE_CURVE]: TrendingUp,
  [EXERCICE_RESULTS_TYPES.PERSONALITY]: Brain,
  [EXERCICE_RESULTS_TYPES.TARGETING]: Target,
  [EXERCICE_RESULTS_TYPES.DISC]: PieChart,
  [EXERCICE_RESULTS_TYPES.SKILL_MAPPING]: Network,
  [EXERCICE_RESULTS_TYPES.CIRCLE_OF_CONTROL]: CircleDot,
}

export function exerciseIcon(slug: string): LucideIcon {
  return EXERCISE_ICONS[slug] ?? Target
}
