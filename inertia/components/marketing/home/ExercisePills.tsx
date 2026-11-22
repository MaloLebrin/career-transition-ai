import React from 'react'
import { EXERCISE_LIST } from '#shared/constants/exercises'
import { brandPastel } from '../tints'

/**
 * Les noms des exercices en pastilles, sans description (le détail est sur `/parcours`).
 * Les couleurs tournent sur les cinq couples pastel ; les pastilles passent à la ligne.
 */
export const ExercisePills: React.FC = () => (
  <ul className="flex flex-wrap gap-2.5" aria-label="Les exercices du parcours">
    {EXERCISE_LIST.map((exercise, index) => {
      const tint = brandPastel(index)
      return (
        <li
          key={exercise.slug}
          className={`flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-bold text-ink ${tint.surface}`}
        >
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${tint.dot}`} aria-hidden="true" />
          {exercise.title}
        </li>
      )
    })}
  </ul>
)
