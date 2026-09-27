import { test } from '@japa/runner'
import { buildCompletedPlanPayload, buildExerciseEndpoint } from '#shared/helpers/exercise_hooks'

test.group('buildExerciseEndpoint', () => {
  test('assemble base, slug et type de point de terminaison', ({ assert }) => {
    assert.equal(
      buildExerciseEndpoint('/dashboard/candidat/exercises', 'disc', 'draft'),
      '/dashboard/candidat/exercises/disc/draft'
    )
    assert.equal(buildExerciseEndpoint('/x', 'values', 'result'), '/x/values/result')
  })
})

test.group('buildCompletedPlanPayload', () => {
  const now = '2026-09-27T10:00:00.000Z'

  test("marque terminées les étapes associées à l'exercice et horodate", ({ assert }) => {
    const payload = buildCompletedPlanPayload(
      [
        { id: 1, completed: false, associatedExercises: ['disc', 'values'] },
        { id: 2, completed: false, lastUpdated: '2026-01-01', associatedExercises: ['values'] },
        { id: 3, completed: true, lastUpdated: '2026-02-01', associatedExercises: null },
        { id: 4, completed: false },
      ],
      'disc',
      now
    )

    assert.deepEqual(payload, [
      { id: 1, completed: true, lastUpdated: now },
      { id: 2, completed: false, lastUpdated: '2026-01-01' },
      { id: 3, completed: true, lastUpdated: '2026-02-01' },
      { id: 4, completed: false, lastUpdated: undefined },
    ])
  })

  test('ne renvoie que id, completed et lastUpdated', ({ assert }) => {
    const [step] = buildCompletedPlanPayload(
      [{ id: 1, completed: false, associatedExercises: ['disc'] }],
      'disc',
      now
    )
    assert.sameMembers(Object.keys(step), ['id', 'completed', 'lastUpdated'])
  })
})
