import vine from '@vinejs/vine'
import { exerciceResultStatusValuesValues, exerciceResultTypesValues } from '#models/exercise_result'

export const saveExerciseResultValidator = vine.compile(
  vine.object({
    type: vine.enum(exerciceResultTypesValues),
    status: vine.enum(exerciceResultStatusValuesValues),
    date: vine.string().optional(),
    duration: vine.number().positive().optional(),
    data: vine.object({}).allowUnknownProperties(),
    quantitativeScore: vine.number().optional(),
    qualitativeAnalysis: vine.string().optional(),
    plan: vine.array(
      vine.object({
        id: vine.number(),
        completed: vine.boolean(),
        lastUpdated: vine.string().optional(),
      })
    ),
  })
)

