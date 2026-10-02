import { Head } from '@inertiajs/react'
import { CheckCircle2 } from 'lucide-react'
import { ACCOUNT_TYPES, type AccountType, type ExerciseLockReason } from '#shared/constants/b2c'
import type { ExerciceResultType } from '#shared/constants/exercises'
import { canAccessExercise, isFreeExercise } from '#shared/helpers/exercise_access'
import type { ExerciseAccess } from '#shared/types/exercise/access'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import { LockedExerciseCard } from '~/components/dashboard/b2c/LockedExerciseCard'
import AppLink from '~/components/ui/AppLink'
import Badge from '~/components/ui/Badge'
import Card from '~/components/ui/Card'
import type { ExerciseListEntry } from '~/config/exercises'

interface CandidatExerciseListProps {
  exercises: ExerciseListEntry[]
  unlockedExerciseSlugs?: string[]
  completedExerciseSlugs?: string[]
  /** `plan` (B2B, étape du parcours) ou `payment` (B2C, forfait) — #100. */
  lockedReason?: ExerciseLockReason
  accountType?: AccountType
  exerciseAccess?: ExerciseAccess
}

/** Sans prop `exerciseAccess` (anciens appels), on retombe sur la règle B2B. */
function accessFromProps(props: CandidatExerciseListProps): ExerciseAccess {
  return (
    props.exerciseAccess ?? {
      accountType: props.accountType ?? ACCOUNT_TYPES.B2B,
      unlockedExerciseSlugs: (props.unlockedExerciseSlugs ?? []) as ExerciceResultType[],
      lockedReason: props.lockedReason ?? 'plan',
      hasPaidAccess: true,
      freeExerciseTypes: [],
      paymentsEnabled: false,
    }
  )
}

export default function CandidatExerciseList(props: CandidatExerciseListProps) {
  const { exercises = [], completedExerciseSlugs = [] } = props
  const access = accessFromProps(props)
  const completedSet = new Set(completedExerciseSlugs)
  const paymentLock = access.lockedReason === 'payment'

  return (
    <DashboardLayout hideSidebar>
      <Head title="Exercices" />
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center gap-4">
          <AppLink href="/dashboard/candidat" className="text-sm font-medium text-accent hover:underline">
            ← Retour
          </AppLink>
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-display-sm text-ink">Tous les exercices</h1>
          {paymentLock && !access.hasPaidAccess && (
            <p className="max-w-2xl text-base text-muted">
              Les exercices offerts sont en tête de liste. Les autres font partie du forfait.
            </p>
          )}
        </div>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" aria-label="Exercices">
          {exercises.map((ex) => {
            const type = ex.slug as ExerciceResultType
            const isUnlocked = canAccessExercise(access, type)

            if (!isUnlocked) {
              return (
                <li key={ex.slug}>
                  {paymentLock ? (
                    <LockedExerciseCard exercise={ex} paymentsEnabled={access.paymentsEnabled} />
                  ) : (
                    <Card
                      variant="flat"
                      padding="md"
                      className="h-full opacity-70"
                      aria-label={`${ex.title} (verrouillé)`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <h3 className="text-title-md text-ink">{ex.title}</h3>
                        <Badge variant="warning">Verrouillé</Badge>
                      </div>
                      <p className="text-sm text-muted">{ex.description}</p>
                    </Card>
                  )}
                </li>
              )
            }

            return (
              <li key={ex.slug}>
                <AppLink
                  href={`/dashboard/candidat/exercises/${ex.slug}`}
                  className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  <Card padding="md" interactive className="flex h-full flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-title-md text-ink">{ex.title}</h3>
                      {completedSet.has(ex.slug) && (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden="true" />
                      )}
                    </div>
                    <p className="text-sm text-muted">{ex.description}</p>
                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                      {isFreeExercise(access, type) && <Badge variant="sun">Gratuit</Badge>}
                      {paymentLock && !isFreeExercise(access, type) && (
                        <Badge variant="lavender">Inclus dans le forfait</Badge>
                      )}
                      {completedSet.has(ex.slug) && <Badge variant="success">Complété</Badge>}
                    </div>
                  </Card>
                </AppLink>
              </li>
            )
          })}
        </ul>
      </div>
    </DashboardLayout>
  )
}
