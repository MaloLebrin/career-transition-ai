import { test } from '@japa/runner'
import { updateStepValidator } from '#validators/support_plan_step/update_step_validator'
import { APPOINTMENTS_STATUSES } from '#shared/constants/appointment'
import { EXERCICE_RESULTS_TYPES } from '#shared/constants/exercises'

test.group('updateStepValidator', () => {
  test('accepte un objet vide', async ({ assert }) => {
    assert.deepEqual(await updateStepValidator.validate({}), {})
  })

  test('accepte les champs propres à la mise à jour', async ({ assert }) => {
    const result = await updateStepValidator.validate({
      endedAt: '2026-10-01T11:00:00.000Z',
      completed: true,
      notes: 'RAS',
      status: APPOINTMENTS_STATUSES.COMPLETED,
      associatedExercises: [EXERCICE_RESULTS_TYPES.VALUES],
    })

    assert.equal(result.endedAt, '2026-10-01T11:00:00.000Z')
    assert.isTrue(result.completed)
    assert.equal(result.notes, 'RAS')
    assert.equal(result.status, 'completed')
  })

  test('accepte des notes et une date de fin nulles', async ({ assert }) => {
    const result = await updateStepValidator.validate({ endedAt: null, notes: null })
    assert.isNull(result.endedAt)
    assert.isNull(result.notes)
  })

  test('rejette un completed non booléen', async ({ assert }) => {
    await assert.rejects(() => updateStepValidator.validate({ completed: 'oui' }))
  })

  test('rejette un statut inconnu', async ({ assert }) => {
    await assert.rejects(() => updateStepValidator.validate({ status: 'done' }))
  })

  test('rejette un sortOrder non numérique', async ({ assert }) => {
    await assert.rejects(() => updateStepValidator.validate({ sortOrder: 'premier' }))
  })
})
