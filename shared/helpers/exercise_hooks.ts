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

/** Optional IA hook: use from UI when analysis is explicitly requested, not on exercise save. */
export async function resolveExerciseAnalysis(
  type: string,
  data: unknown,
  analyzer: (type: string, data: unknown) => Promise<string>
) {
  try {
    return await analyzer(type, data)
  } catch {
    return "Erreur lors de la génération de l'analyse."
  }
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
