import { EXERCISE_LIST } from '#shared/constants/exercises'
import { Target } from 'lucide-react'
import React from 'react'
import { Reveal } from '~/components/ui/Reveal'
import { EXERCISE_ICONS } from './exercise_icons'
import { MARKETING_TINT_CYCLE, MARKETING_TINTS } from './tints'

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
