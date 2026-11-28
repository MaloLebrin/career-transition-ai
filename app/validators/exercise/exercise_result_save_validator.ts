import {
  exerciceResultStatusValuesValues,
  exerciceResultTypesValues,
} from '#shared/constants/exercises'
import vine from '@vinejs/vine'

export const saveExerciseResultValidator = vine.create({
  type: vine.enum(exerciceResultTypesValues),
  status: vine.enum(exerciceResultStatusValuesValues),
  date: vine.string().optional(),
  /** 0 is valid (e.g. exercise finalized in under 1s; client sends floor(seconds)). */
  duration: vine.number().min(0).optional(),
  data: vine.object({}).allowUnknownProperties(),
  // Ni `quantitativeScore` ni `qualitativeAnalysis` (#168) : l'analyse n'est
  // écrite que par `AnalyzeExerciseQualitativeJob`, le score jamais par le client.
  plan: vine.array(
    vine.object({
      id: vine.number(),
      completed: vine.boolean(),
      lastUpdated: vine.string().optional(),
    })
  ),
})
