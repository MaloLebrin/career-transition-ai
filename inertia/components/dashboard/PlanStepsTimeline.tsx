import type { EmployeeData } from '../../types/employee'
import PlanStepItem from './PlanStepItem'

type PlanStep = EmployeeData['plan'][number]
type Exercise = EmployeeData['exercises'][number]

function normalizeType(type: string): string {
  return String(type).toLowerCase()
}

function getLatestProgressByType(exercises: Exercise[]): Record<string, number> {
  const latestByType = new Map<string, { ts: string; progress: number }>()

  for (const ex of exercises ?? []) {
    const type = normalizeType(ex.type)
    const ts = String(ex.date ?? '')
    const current = latestByType.get(type)
    const progress =
      typeof ex.progressPercent === 'number' ? ex.progressPercent : 0

    if (!current || ts > current.ts) {
      latestByType.set(type, { ts, progress })
    }
  }

  const out: Record<string, number> = {}
  for (const [type, v] of latestByType.entries()) {
    out[type] = v.progress
  }
  return out
}

export function stepCompletionFromProgress(
  step: PlanStep,
  exerciseProgressByType: Record<string, number>
): boolean {
  if (step.completed) return true
  const associated = step.associatedExercises
  if (!associated?.length) return false
  return associated.every(
    (ex) => (exerciseProgressByType[normalizeType(ex)] ?? 0) >= 100
  )
}

export default function PlanStepsTimeline({
  plan,
  exercises,
}: {
  plan: PlanStep[]
  exercises: Exercise[]
}) {
  const exerciseProgressByType = getLatestProgressByType(exercises)

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
            exercises={exercises}
          />
        )
      })}
    </div>
  )
}

