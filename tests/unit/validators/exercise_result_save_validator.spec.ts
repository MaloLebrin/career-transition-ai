import { test } from '@japa/runner'
import { saveExerciseResultValidator } from '#validators/exercise/exercise_result_save_validator'
import {
  exerciceResultStatusValuesValues,
  exerciceResultTypesValues,
} from '#shared/constants/exercises'

test.group('saveExerciseResultValidator', () => {
  test('accepts a valid payload', async ({ assert }) => {
    const data = {
      type: exerciceResultTypesValues[0],
      status: exerciceResultStatusValuesValues[1],
      date: '2025-01-05',
      duration: 30,
      data: { foo: 'bar' },
      plan: [{ id: 1, completed: true, lastUpdated: '2025-01-05T10:00:00Z' }],
    }

    const result = await saveExerciseResultValidator.validate(data)
    assert.equal(result.type, data.type)
    assert.equal(result.status, data.status)
    assert.lengthOf(result.plan, 1)
  })

  test('rejects invalid type', async ({ assert }) => {
    const data: any = {
      type: 'unknown',
      status: exerciceResultStatusValuesValues[1],
      data: {},
      plan: [],
    }

    await assert.rejects(() => saveExerciseResultValidator.validate(data))
  })

  test('accepts duration zero (fast finalize)', async ({ assert }) => {
    const data = {
      type: exerciceResultTypesValues[0],
      status: exerciceResultStatusValuesValues[1],
      date: '2025-01-05',
      duration: 0,
      data: { foo: 'bar' },
      plan: [],
    }

    const result = await saveExerciseResultValidator.validate(data)
    assert.equal(result.duration, 0)
  })

  test('écarte le score et l’analyse envoyés par le client (#168)', async ({ assert }) => {
    const result = await saveExerciseResultValidator.validate({
      type: exerciceResultTypesValues[0],
      status: exerciceResultStatusValuesValues[1],
      data: {},
      quantitativeScore: 99,
      qualitativeAnalysis: 'Analyse forgée',
      plan: [],
    })

    assert.notProperty(result, 'quantitativeScore')
    assert.notProperty(result, 'qualitativeAnalysis')
  })
})
