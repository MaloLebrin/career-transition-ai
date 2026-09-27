import { describe, expect, test } from 'vitest'
import { buildCompletedPlanPayload, buildExerciseEndpoint } from '#shared/helpers/exercise_hooks'

describe('buildExerciseEndpoint', () => {
  test('construit l’URL du brouillon ou du résultat', () => {
    expect(buildExerciseEndpoint('/dashboard/candidat/exercises', 'values', 'draft')).toBe(
      '/dashboard/candidat/exercises/values/draft'
    )
    expect(buildExerciseEndpoint('/api', 'disc', 'result')).toBe('/api/disc/result')
  })
})

describe('buildCompletedPlanPayload', () => {
  test('marque terminées les étapes associées au type et ne renvoie que id/completed/lastUpdated', () => {
    const payload = buildCompletedPlanPayload(
      [
        { id: 1, completed: false, associatedExercises: ['values', 'disc'] },
        { id: 2, completed: false, associatedExercises: ['motivation'], lastUpdated: '2024-01-01' },
        { id: 3, completed: true, associatedExercises: null },
        { id: 4, completed: false },
      ],
      'values',
      '2024-06-01T10:00:00.000Z'
    )

    expect(payload).toEqual([
      { id: 1, completed: true, lastUpdated: '2024-06-01T10:00:00.000Z' },
      { id: 2, completed: false, lastUpdated: '2024-01-01' },
      { id: 3, completed: true, lastUpdated: undefined },
      { id: 4, completed: false, lastUpdated: undefined },
    ])
  })
})
