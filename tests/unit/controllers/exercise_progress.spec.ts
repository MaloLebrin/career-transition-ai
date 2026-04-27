import { test } from '@japa/runner'
import { EXERCICE_RESULTS_TYPES } from '#shared/constants/exercises'
import { getExerciseProgress, getExerciseProgressByType } from '#shared/helpers/exercise_progress'

test.group('exercise_progress helper', () => {
  test('returns bounded percent per exercise rule', async ({ assert }) => {
    const lifeCurve = getExerciseProgress(EXERCICE_RESULTS_TYPES.LIFE_CURVE, {
      points: [
        { year: 2020, satisfaction: 5, label: 'A' },
        { year: 2021, satisfaction: 6, label: 'B' },
      ],
      reflection: {
        form: 'up',
        mostlySatisfied: 'yes',
        amplitude: '',
        explanation: '',
        surprise: '',
        coherence: '',
      },
    })

    const values = getExerciseProgress(EXERCICE_RESULTS_TYPES.VALUES, {
      selectedValues: ['A', 'B', 'C', 'D', 'E'],
      peopleExercise: [
        { name: 'X', values: 'Y' },
        { name: '', values: '' },
        { name: '', values: '' },
      ],
    })

    assert.isAtLeast(lifeCurve, 0)
    assert.isAtMost(lifeCurve, 100)
    assert.isAtLeast(values, 0)
    assert.isAtMost(values, 100)
  })

  test('returns 100 for completed status (case-insensitive)', async ({ assert }) => {
    const percent = getExerciseProgress(EXERCICE_RESULTS_TYPES.MOTIVATION, {}, 'COMPLETED')
    assert.equal(percent, 100)
  })

  test('builds progress map using latest item by type', async ({ assert }) => {
    const results = [
      {
        type: EXERCICE_RESULTS_TYPES.MOTIVATION,
        status: 'completed',
        data: {},
        progressPercent: null,
        date: { toISO: () => '2026-01-01T00:00:00.000Z' },
        updatedAt: { toISO: () => '2026-01-01T00:00:00.000Z' },
      },
      {
        type: EXERCICE_RESULTS_TYPES.MOTIVATION,
        status: 'draft',
        data: {
          matrix: [
            [null, 0],
            [null, null],
          ],
          currentI: 0,
          currentJ: 1,
        },
        progressPercent: 40,
        date: null,
        updatedAt: { toISO: () => '2026-02-01T00:00:00.000Z' },
      },
      {
        type: EXERCICE_RESULTS_TYPES.VALUES,
        status: 'completed',
        data: {},
        progressPercent: 100,
        date: { toISO: () => '2026-03-01T00:00:00.000Z' },
        updatedAt: { toISO: () => '2026-03-01T00:00:00.000Z' },
      },
    ]

    const map = getExerciseProgressByType(results as any)
    assert.equal(map.motivation, 40)
    assert.equal(map.values, 100)
    assert.equal(map.personality, 0)
  })
})
