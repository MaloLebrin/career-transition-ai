import { EXERCISE_LIST } from '#shared/constants/exercises'
import React from 'react'
import Card from '~/components/ui/Card'

/** Les huit exercices réels de la plateforme, la preuve concrète du parcours. */
export const ExerciseCatalogue: React.FC = () => (
  <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {EXERCISE_LIST.map((exercise, index) => (
      <li key={exercise.slug}>
        <Card padding="md" className="flex h-full flex-col gap-3">
          <span className="text-caption text-primary">Exercice {index + 1}</span>
          <h3 className="text-title-sm">{exercise.title}</h3>
          <p className="text-sm leading-relaxed text-muted">{exercise.description}</p>
        </Card>
      </li>
    ))}
  </ol>
)
