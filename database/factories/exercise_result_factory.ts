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
      analyzedAt: null,
    }
  })
  // Résultat déjà analysé par le job IA (#168) : texte + marqueur.
  .state('analyzed', (row) => {
    row.qualitativeAnalysis = row.qualitativeAnalysis ?? 'Analyse IA'
    row.analyzedAt = DateTime.now()
  })
  .build()
