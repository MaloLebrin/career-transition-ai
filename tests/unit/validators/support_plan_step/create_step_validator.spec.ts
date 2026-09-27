import { test } from '@japa/runner'
import { createStepValidator } from '#validators/support_plan_step/create_step_validator'
import { APPOINTMENTS_STATUSES } from '#shared/constants/appointment'
import { EXERCICE_RESULTS_TYPES } from '#shared/constants/exercises'

test.group('createStepValidator', () => {
  test('accepte un objet vide (tous les champs optionnels)', async ({ assert }) => {
    assert.deepEqual(await createStepValidator.validate({}), {})
  })

  test('accepte une étape complète', async ({ assert }) => {
    const payload = {
      title: ' Entretien bilan ',
      description: 'Point à mi-parcours',
      instructions: 'Préparer ses questions',
      dueDate: '2026-10-01',
      scheduledAt: '2026-10-01T10:00:00.000Z',
      status: APPOINTMENTS_STATUSES.SCHEDULED,
      locationOrLink: 'https://visio.example.com/abc',
      associatedExercises: [EXERCICE_RESULTS_TYPES.DISC, EXERCICE_RESULTS_TYPES.MOTIVATION],
      sortOrder: 2,
      isLocked: true,
    }
    const result = await createStepValidator.validate(payload)

    assert.equal(result.title, 'Entretien bilan')
    assert.equal(result.status, 'scheduled')
    assert.deepEqual(result.associatedExercises, payload.associatedExercises)
    assert.isTrue(result.isLocked)
  })

  test('accepte les champs nullables à null', async ({ assert }) => {
    const result = await createStepValidator.validate({
      title: null,
      description: null,
      instructions: null,
      dueDate: null,
      scheduledAt: null,
      locationOrLink: null,
    })
    assert.isNull(result.title)
    assert.isNull(result.locationOrLink)
  })

  test('rejette un statut inconnu', async ({ assert }) => {
    await assert.rejects(() => createStepValidator.validate({ status: 'postponed' }))
  })

  test("rejette un type d'exercice inconnu", async ({ assert }) => {
    await assert.rejects(() => createStepValidator.validate({ associatedExercises: ['sudoku'] }))
  })

  test('rejette un titre de plus de 255 caractères', async ({ assert }) => {
    await assert.rejects(() => createStepValidator.validate({ title: 'x'.repeat(256) }))
  })

  test('rejette un lieu/lien de plus de 512 caractères', async ({ assert }) => {
    await assert.rejects(() => createStepValidator.validate({ locationOrLink: 'x'.repeat(513) }))
  })
})
