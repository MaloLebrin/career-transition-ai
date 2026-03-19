import { EXERCISE_LIST } from '#shared/constants/exercises'

/**
 * Returns a human-friendly title for an exercise slug/type.
 * Falls back to the provided value when unknown.
 */
export function getExerciseTitle(type: string): string {
  const normalized = type.toLowerCase()
  const exercise = EXERCISE_LIST.find((e) => e.slug === normalized)
  return exercise?.title ?? type
}
