import { Lock } from 'lucide-react'
import { BILLING_PATHS } from '#shared/constants/billing'
import type { ExerciseListEntry } from '#shared/constants/exercises'
import AppLink from '~/components/ui/AppLink'
import Badge from '~/components/ui/Badge'
import { buttonClassName } from '~/components/ui/Button'
import Card from '~/components/ui/Card'

interface LockedExerciseCardProps {
  exercise: Pick<ExerciseListEntry, 'slug' | 'title' | 'description'>
  /** `STRIPE_ENABLED` : sinon le CTA annonce « Bientôt disponible ». */
  paymentsEnabled: boolean
}

/**
 * Exercice du forfait, verrouillé tant qu'un particulier n'a pas payé (#100).
 * Le verrou réel est côté serveur : la carte ne fait qu'orienter vers l'offre.
 */
export function LockedExerciseCard({ exercise, paymentsEnabled }: LockedExerciseCardProps) {
  return (
    <Card
      variant="flat"
      padding="md"
      className="flex h-full flex-col gap-4"
      aria-labelledby={`locked-exercise-${exercise.slug}`}
      role="group"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 id={`locked-exercise-${exercise.slug}`} className="text-title-md text-ink">
          {exercise.title}
        </h3>
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-muted"
          aria-hidden="true"
        >
          <Lock className="h-4 w-4" />
        </span>
      </div>
      <p className="text-sm text-muted">{exercise.description}</p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
        <Badge variant="lavender">Inclus dans le forfait</Badge>
        {paymentsEnabled ? (
          <AppLink
            href={BILLING_PATHS.offer}
            className={buttonClassName({ variant: 'primary', size: 'sm' })}
            aria-label={`Débloquer : ${exercise.title}`}
          >
            Débloquer
          </AppLink>
        ) : (
          <span className="text-caption text-muted">Bientôt disponible</span>
        )}
      </div>
    </Card>
  )
}
