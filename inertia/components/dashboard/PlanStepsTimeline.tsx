import type { EmployeeData } from '../../types/employee'
import PlanStepItem from './PlanStepItem'

type PlanStep = EmployeeData['plan'][number]

/** Slug used in exerciseProgressByType keys (e.g. life_curve). */
function exerciseSlugFromPlanToken(exerciseType: string): string {
  return String(exerciseType).toLowerCase()
}

function stepCompletionFromProgress(
  step: PlanStep,
  exerciseProgressByType: Record<string, number>
): boolean {
  if (step.completed) return true
  const associated = step.associatedExercises
  if (!associated?.length) return false
  return associated.every(
    (ex) => (exerciseProgressByType[exerciseSlugFromPlanToken(ex)] ?? 0) >= 100
  )
}

export default function PlanStepsTimeline({
  plan,
  exerciseProgressByType,
}: {
  plan: PlanStep[]
  exerciseProgressByType: Record<string, number>
}) {
  return (
    <div className="space-y-10">
      {plan.map((step, idx) => {
        const stepDone = stepCompletionFromProgress(step, exerciseProgressByType)
        const isLocked = Boolean(step.isLocked && !step.completed)

        return (
          <PlanStepItem
            key={step.id}
            step={step}
            index={idx}
            stepDone={stepDone}
            isLocked={isLocked}
            exerciseProgressByType={exerciseProgressByType}
          />
        )
      })}
    </div>
  )
}

