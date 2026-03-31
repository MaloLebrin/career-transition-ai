import { formatDateTimeFR } from '#shared/helpers/date'
import AppLink from '../ui/AppLink'
import Button from '../ui/Button'

type PlanStep = {
  id: number
  sortOrder?: number | null
  scheduledAt?: string | null
  instructions?: string | null
  completed: boolean
  associatedExercises?: string[] | null
  isLocked?: boolean
}

/** Slug used in exerciseProgressByType keys (e.g. life_curve). */
function exerciseSlugFromPlanToken(exerciseType: string): string {
  return String(exerciseType).toLowerCase()
}

function PlanStepExercises({
  isLocked,
  associatedExercises,
  exerciseProgressByType,
}: {
  isLocked: boolean
  associatedExercises: string[]
  exerciseProgressByType: Record<string, number>
}) {
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {associatedExercises.map((exerciseType) => {
        const exerciseLabel = exerciseType.replace(/_/g, ' ')
        const slug = exerciseSlugFromPlanToken(exerciseType)
        const pct = exerciseProgressByType?.[slug] ?? 0
        console.log(pct, `pct for ${exerciseType}`)
        const exerciseComplete = pct >= 100

        if (isLocked) {
          return (
            <Button
              key={exerciseType}
              variant="secondary"
              size="sm"
              disabled
              icon={
                <svg
                  className="w-4 h-4 stroke-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              }
            >
              {exerciseLabel}
            </Button>
          )
        }

        return (
          <AppLink key={exerciseType} href={`/dashboard/candidat/exercises/${slug}`}>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={
                  exerciseComplete ? (
                    <span className="text-brand-sage font-black" aria-hidden>
                      ✓
                    </span>
                  ) : (
                    <svg
                      className="w-4 h-4 stroke-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  )
                }
              >
                {exerciseLabel}
              </Button>
              <span className="text-[10px] font-bold text-brand-sage uppercase tracking-wider">
                {exerciseComplete ? 'Complété' : `${pct}%`}
              </span>
            </div>
          </AppLink>
        )
      })}
    </div>
  )
}

export default function PlanStepItem({
  step,
  index,
  stepDone,
  isLocked,
  exerciseProgressByType,
}: {
  step: PlanStep
  index: number
  stepDone: boolean
  isLocked: boolean
  exerciseProgressByType: Record<string, number>
}) {
  return (
    <div className="relative flex items-start group">
      <div
        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
          stepDone
            ? 'bg-brand-sage text-white shadow-lg shadow-brand-sage/20'
            : isLocked
            ? 'bg-amber-100 border-2 border-amber-200 text-amber-600'
            : 'bg-white border-2 border-brand-navy/5 text-brand-navy/20'
        }`}
      >
        {stepDone ? (
          '✓'
        ) : isLocked ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        ) : (
          index + 1
        )}
      </div>

      <div className="ml-3 grow pb-10 border-l-2 border-brand-navy/5 pl-5 last:border-transparent">
        <div className="flex items-center gap-2">
          <h4
            className={`font-bold text-xl ${
              stepDone ? 'text-brand-navy/40' : isLocked ? 'text-brand-navy/60' : 'text-brand-navy'
            }`}
          >
            RDV {(step.sortOrder ?? index) + 1}
          </h4>
          {isLocked && (
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full bg-amber-100 text-amber-600">
              Verrouillée
            </span>
          )}
        </div>

        {step.scheduledAt && (
          <p className="text-brand-terracotta font-medium mt-1 text-sm">
            {formatDateTimeFR(step.scheduledAt)}
          </p>
        )}
        {step.instructions && (
          <p className="text-brand-navy/60 mt-2 text-sm">{step.instructions}</p>
        )}

        {isLocked && (
          <div className="mt-6 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-4 py-3 rounded-xl">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span>Cette étape sera débloquée par votre conseiller</span>
          </div>
        )}

        {step.associatedExercises && step.associatedExercises.length > 0 && !stepDone && (
          <PlanStepExercises
            isLocked={isLocked}
            associatedExercises={step.associatedExercises}
            exerciseProgressByType={exerciseProgressByType}
          />
        )}

        {stepDone && (
          <AppLink href={`/dashboard/candidat/steps/${step.id}`}>
            <Button className="mt-6" variant="outline" size="sm">
              Voir le résultat →
            </Button>
          </AppLink>
        )}
      </div>
    </div>
  )
}

