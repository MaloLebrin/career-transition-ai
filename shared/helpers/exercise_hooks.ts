export type ExerciseEndpointKind = 'draft' | 'result'

type PlanLikeStep = {
  id: number
  completed: boolean
  lastUpdated?: string
  associatedExercises?: string[] | null
}

export function buildExerciseEndpoint(basePath: string, slug: string, kind: ExerciseEndpointKind) {
  return `${basePath}/${slug}/${kind}`
}

export function buildCompletedPlanPayload(
  plan: PlanLikeStep[],
  type: string,
  now: string
): Array<{ id: number; completed: boolean; lastUpdated?: string }> {
  return plan
    .map((step) =>
      step.associatedExercises?.includes(type) ? { ...step, completed: true, lastUpdated: now } : step
    )
    .map((step) => ({
      id: step.id,
      completed: step.completed,
      lastUpdated: step.lastUpdated,
    }))
}
