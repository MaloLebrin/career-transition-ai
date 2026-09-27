import ExerciseResult from '#models/exercise_result'
import { exerciceResultStatusValues, exerciceResultTypesValues } from '#shared/constants/exercises'
import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'

export const ExerciseResultFactory = factory
  .define(ExerciseResult, ({ faker }) => {
    return {
      employeeId: 0, // à surcharger
      type: faker.helpers.arrayElement(exerciceResultTypesValues),
      status: exerciceResultStatusValues.COMPLETED,
      date: DateTime.now(),
      duration: null,
      progressPercent: 100,
      data: {},
      quantitativeScore: null,
      qualitativeAnalysis: null,
    }
  })
  .build()
