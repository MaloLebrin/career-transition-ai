import { CheckCircle2 } from 'lucide-react'
import type { ExerciceResultType, ExerciseListEntry } from '#shared/constants/exercises'
import { orderExercisesForB2c } from '#shared/helpers/b2c_access'
import { canAccessExercise, isFreeExercise } from '#shared/helpers/exercise_access'
import type { ExerciseAccess } from '#shared/types/exercise/access'
import { LockedExerciseCard } from '~/components/dashboard/b2c/LockedExerciseCard'
import AppLink from '~/components/ui/AppLink'
import Badge from '~/components/ui/Badge'
import Card from '~/components/ui/Card'

interface B2cExerciseGridProps {
  exercises: ExerciseListEntry[]
  exerciseAccess: ExerciseAccess
  /** Progression par slug (0–100), issue de `exerciseProgressByType`. */
  progressByType: Record<string, number>
}

/**
 * Catalogue d'exercices d'un particulier (#100) : les gratuits d'abord, puis
 * ceux du forfait — déverrouillés si payé, sinon `LockedExerciseCard`.
 */
export function B2cExerciseGrid({ exercises, exerciseAccess, progressByType }: B2cExerciseGridProps) {
  const ordered = orderExercisesForB2c(exercises, exerciseAccess.freeExerciseTypes)

  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-label="Vos exercices">
      {ordered.map((exercise) => {
        const type = exercise.slug as ExerciceResultType
        if (!canAccessExercise(exerciseAccess, type)) {
          return (
            <li key={exercise.slug}>
              <LockedExerciseCard
                exercise={exercise}
                paymentsEnabled={exerciseAccess.paymentsEnabled}
              />
            </li>
          )
        }

        const progress = progressByType[exercise.slug] ?? 0
        const completed = progress >= 100
        return (
          <li key={exercise.slug}>
            <AppLink
              href={`/dashboard/candidat/exercises/${exercise.slug}`}
              className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <Card padding="md" interactive className="flex h-full flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-title-md text-ink">{exercise.title}</h3>
                  {completed && (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-label="Terminé" />
                  )}
                </div>
                <p className="text-sm text-muted">{exercise.description}</p>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
                  {isFreeExercise(exerciseAccess, type) ? (
                    <Badge variant="sun">Gratuit</Badge>
                  ) : (
                    <Badge variant="lavender">Inclus dans le forfait</Badge>
                  )}
                  <span className="text-caption text-muted">
                    {completed ? 'Terminé' : progress > 0 ? `En cours · ${progress} %` : 'À commencer'}
                  </span>
                </div>
              </Card>
            </AppLink>
          </li>
        )
      })}
    </ul>
  )
}
