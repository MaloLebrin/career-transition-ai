import { Sparkles, UserRound } from 'lucide-react'
import { EXERCISE_LIST } from '#shared/constants/exercises'
import type { ExerciseAccess } from '#shared/types/exercise/access'
import { B2cExerciseGrid } from '~/components/dashboard/b2c/B2cExerciseGrid'
import AppLink from '~/components/ui/AppLink'
import { buttonClassName } from '~/components/ui/Button'
import Card from '~/components/ui/Card'
import { Eyebrow } from '~/components/ui/Eyebrow'
import type { EmployeeData } from '~/types/employee'

export interface B2cEmployeeHomeProps {
  employee: EmployeeData
  /** Expert interne assigné par la plateforme (#103 / #105), ou `null`. */
  advisor: { name: string } | null
  exerciseAccess: ExerciseAccess
  completedExercises: number
  totalExercises: number
  exerciseCompletionPercent: number
  exerciseProgressByType: Record<string, number>
}

/**
 * Accueil d'un particulier (#100) : pas de feuille de route (aucun plan
 * d'accompagnement), le catalogue d'exercices avec les gratuits en tête, et
 * l'expert assigné s'il y en a un.
 */
export function B2cEmployeeHome({
  employee,
  advisor,
  exerciseAccess,
  completedExercises,
  totalExercises,
  exerciseCompletionPercent,
  exerciseProgressByType,
}: B2cEmployeeHomeProps) {
  const firstName = employee.name.split(' ')[0]
  const freeCount = exerciseAccess.freeExerciseTypes.length

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <Card variant="dark" className="space-y-6">
        <div className="space-y-3">
          <Eyebrow tone="inverse" icon={<Sparkles className="h-4 w-4" />}>
            Votre parcours
          </Eyebrow>
          <h1 className="font-display text-display-sm text-on-ink">Bonjour {firstName}</h1>
          <p className="max-w-xl text-base text-on-ink-soft">
            {employee.targetRole ? (
              <>
                Vous préparez votre transition vers{' '}
                <span className="font-semibold text-on-ink">{employee.targetRole}</span>.{' '}
              </>
            ) : null}
            {exerciseAccess.hasPaidAccess
              ? 'Tous les exercices et vos résultats sont débloqués.'
              : `Commencez par les ${freeCount} exercices offerts : vos résultats sont visibles immédiatement.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <AppLink
            href="/dashboard/candidat/profile"
            className={buttonClassName({ variant: 'secondary', size: 'md' })}
          >
            Mon profil
          </AppLink>
          <AppLink
            href="/dashboard/candidat/synthesis"
            className={buttonClassName({
              variant: 'outline',
              size: 'md',
              className: 'border-on-ink-muted bg-transparent text-on-ink hover:bg-ink-elevated',
            })}
          >
            Ma synthèse
          </AppLink>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Card className="space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-title-lg text-ink">Vos exercices</h2>
                <span className="text-sm text-muted">
                  {completedExercises}/{totalExercises} terminés · {exerciseCompletionPercent} %
                </span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-surface-soft"
                role="progressbar"
                aria-label="Progression des exercices"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={exerciseCompletionPercent}
              >
                <div
                  className="h-full rounded-full bg-success transition-all"
                  style={{ width: `${exerciseCompletionPercent}%` }}
                />
              </div>
            </div>
            <B2cExerciseGrid
              exercises={EXERCISE_LIST}
              exerciseAccess={exerciseAccess}
              progressByType={exerciseProgressByType}
            />
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-4">
          {advisor && (
            <Card variant="accent" padding="md" className="flex items-start gap-4">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-accent"
                aria-hidden="true"
              >
                <UserRound className="h-5 w-5" />
              </span>
              <div className="space-y-1">
                <h2 className="text-title-sm text-ink">Votre expert : {advisor.name}</h2>
                <p className="text-sm text-ink-soft">
                  Il suit votre parcours et peut vous proposer des étapes et des notes.
                </p>
              </div>
            </Card>
          )}
          {employee.advisorNotes && (
            <Card variant="sun" padding="md" className="space-y-2">
              <h2 className="text-title-sm text-ink">Conseils de votre expert</h2>
              <p className="text-sm italic text-ink-soft">« {employee.advisorNotes} »</p>
            </Card>
          )}
          {employee.skills.length > 0 && (
            <Card padding="md" className="space-y-4">
              <h2 className="text-title-sm text-ink">Vos compétences</h2>
              <ul className="space-y-3">
                {employee.skills.slice(0, 5).map((skill) => (
                  <li key={skill.id} className="space-y-1.5">
                    <div className="flex justify-between text-sm text-ink-soft">
                      <span>{skill.name}</span>
                      <span className="text-muted">{skill.level}/5</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-soft">
                      <div
                        className="h-full rounded-full bg-tint-lake-bold"
                        style={{ width: `${(skill.level / 5) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
