import { EXERCISE_LIST } from '#shared/constants/exercises'
import React from 'react'
import { MARKETING_TINT_CYCLE, MARKETING_TINTS } from './tints'

/** Les huit exercices réels de la plateforme, la preuve concrète du parcours. */
export const ExerciseCatalogue: React.FC = () => (
  <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {EXERCISE_LIST.map((exercise, index) => {
      const tint = MARKETING_TINTS[MARKETING_TINT_CYCLE[index % MARKETING_TINT_CYCLE.length]]
      return (
        <li key={exercise.slug}>
          <div
            className={`flex h-full flex-col gap-3 rounded-xl p-6 transition-transform hover:-translate-y-1 ${tint.surface}`}
          >
            <span className={`text-caption font-medium ${tint.ink}`}>Exercice {index + 1}</span>
            <h3 className="text-title-sm">{exercise.title}</h3>
            <p className="text-sm leading-relaxed text-ink-soft">{exercise.description}</p>
          </div>
        </li>
      )
    })}
  </ol>
)
