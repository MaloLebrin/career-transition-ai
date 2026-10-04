import { EXERCICE_RESULTS_TYPES, EXERCISE_LIST } from '#shared/constants/exercises'
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
import React from 'react'
import { Reveal } from '~/components/ui/Reveal'
import { MARKETING_TINT_CYCLE, MARKETING_TINTS } from './tints'

const EXERCISE_ICONS: Record<string, LucideIcon> = {
  [EXERCICE_RESULTS_TYPES.MOTIVATION]: Flame,
  [EXERCICE_RESULTS_TYPES.VALUES]: Gem,
  [EXERCICE_RESULTS_TYPES.LIFE_CURVE]: TrendingUp,
  [EXERCICE_RESULTS_TYPES.PERSONALITY]: Brain,
  [EXERCICE_RESULTS_TYPES.TARGETING]: Target,
  [EXERCICE_RESULTS_TYPES.DISC]: PieChart,
  [EXERCICE_RESULTS_TYPES.SKILL_MAPPING]: Network,
  [EXERCICE_RESULTS_TYPES.CIRCLE_OF_CONTROL]: CircleDot,
}

/** Les huit exercices réels de la plateforme, la preuve concrète du parcours. */
export const ExerciseCatalogue: React.FC = () => (
  <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {EXERCISE_LIST.map((exercise, index) => {
      const tint = MARKETING_TINTS[MARKETING_TINT_CYCLE[index % MARKETING_TINT_CYCLE.length]]
      const Icon = EXERCISE_ICONS[exercise.slug] ?? Target
      return (
        <li key={exercise.slug}>
          <Reveal delay={(index % 4) * 80} className="h-full">
            <div
              className={`group flex h-full flex-col gap-3 rounded-xl p-6 transition duration-300 hover:-translate-y-1 hover:shadow-raised ${tint.surface}`}
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-lg bg-surface/70 transition duration-300 group-hover:rotate-6 group-hover:scale-110 ${tint.ink}`}
                aria-hidden="true"
              >
                <Icon size={22} />
              </span>
              <span className={`text-caption font-medium ${tint.ink}`}>Exercice {index + 1}</span>
              <h3 className="text-title-sm">{exercise.title}</h3>
              <p className="text-sm leading-relaxed text-ink-soft">{exercise.description}</p>
            </div>
          </Reveal>
        </li>
      )
    })}
  </ol>
)
