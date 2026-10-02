import { describe, expect, test } from 'vitest'
import {
  canAccessExercise,
  canSeeExerciseAiAnalysis,
  canSeeExerciseResults,
  isExerciseLocked,
  isFreeExercise,
} from '#shared/helpers/exercise_access'
import type { ExerciseAccess } from '#shared/types/exercise/access'

const b2b: ExerciseAccess = {
  accountType: 'b2b',
  unlockedExerciseSlugs: ['motivation'],
  lockedReason: 'plan',
  hasPaidAccess: true,
  freeExerciseTypes: [],
  paymentsEnabled: false,
}

const b2cFree: ExerciseAccess = {
  accountType: 'b2c',
  unlockedExerciseSlugs: ['motivation', 'values'],
  lockedReason: 'payment',
  hasPaidAccess: false,
  freeExerciseTypes: ['motivation', 'values'],
  paymentsEnabled: true,
}

const b2cPaid: ExerciseAccess = {
  ...b2cFree,
  unlockedExerciseSlugs: ['motivation', 'values', 'disc'],
  hasPaidAccess: true,
}

describe('shared/helpers/exercise_access (#100)', () => {
  test('canAccessExercise / isExerciseLocked lisent la liste déverrouillée', () => {
    expect(canAccessExercise(b2b, 'motivation')).toBe(true)
    expect(canAccessExercise(b2b, 'disc')).toBe(false)
    expect(isExerciseLocked(b2b, 'disc')).toBe(true)
    expect(isExerciseLocked(b2cFree, 'values')).toBe(false)
  })

  test('isFreeExercise ne vaut que pour un B2C', () => {
    expect(isFreeExercise(b2cFree, 'motivation')).toBe(true)
    expect(isFreeExercise(b2cFree, 'disc')).toBe(false)
    expect(isFreeExercise({ ...b2b, freeExerciseTypes: ['motivation'] }, 'motivation')).toBe(false)
  })

  test('B2B : résultats et analyses toujours visibles, même hors plan', () => {
    expect(canSeeExerciseResults(b2b, 'disc')).toBe(true)
    expect(canSeeExerciseAiAnalysis(b2b, 'disc')).toBe(true)
  })

  test('B2C non payé : résultats et analyse des gratuits seulement', () => {
    expect(canSeeExerciseResults(b2cFree, 'values')).toBe(true)
    expect(canSeeExerciseAiAnalysis(b2cFree, 'values')).toBe(true)
    expect(canSeeExerciseResults(b2cFree, 'disc')).toBe(false)
    expect(canSeeExerciseAiAnalysis(b2cFree, 'disc')).toBe(false)
  })

  test('B2C payé : tout est visible', () => {
    expect(canSeeExerciseResults(b2cPaid, 'disc')).toBe(true)
    expect(canSeeExerciseAiAnalysis(b2cPaid, 'disc')).toBe(true)
  })
})
