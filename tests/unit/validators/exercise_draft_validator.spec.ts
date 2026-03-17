import { test } from '@japa/runner'
import {
  fetchExerciseDraftValidator,
  saveExerciseDraftValidator,
} from '#validators/exercise/exercise_draft_validator'
import { exerciceResultTypesValues } from '#models/exercise_result'

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

  test('fetchExerciseDraftValidator rejects invalid type', async ({ assert }) => {
    const data: any = {
      employeeId: '1',
      type: 'invalid',
    }

    await assert.rejects(() => fetchExerciseDraftValidator.validate(data))
  })
})
