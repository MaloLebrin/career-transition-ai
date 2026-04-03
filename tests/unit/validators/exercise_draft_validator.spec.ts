import { test } from '@japa/runner'
import { saveExerciseDraftValidator } from '#validators/exercise/exercise_draft_validator'
import { exerciceResultTypesValues } from '#shared/constants/exercises'

test.group('exercise draft validators', () => {
  test('saveExerciseDraftValidator accepts valid draft', async ({ assert }) => {
    const data = {
      employeeId: '1',
      type: exerciceResultTypesValues[0],
      data: { foo: 'bar' },
    }

    const result = await saveExerciseDraftValidator.validate(data)
    assert.equal(result.employeeId, '1')
    assert.equal(result.type, data.type)
  })

  test('saveExerciseDraftValidator rejects numeric employeeId (Inertia JSON sends numbers)', async ({
    assert,
  }) => {
    const data: any = {
      employeeId: 1,
      type: exerciceResultTypesValues[0],
      data: {},
    }

    await assert.rejects(() => saveExerciseDraftValidator.validate(data))
  })
})
