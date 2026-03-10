import vine from '@vinejs/vine'
import { exerciceResultTypesValues } from '#models/exercise_result'

export const saveExerciseDraftValidator = vine.create({
  employeeId: vine.string(),
  type: vine.enum(exerciceResultTypesValues),
  data: vine.object({}).allowUnknownProperties(),
})

export const fetchExerciseDraftValidator = vine.create({
  employeeId: vine.string(),
  type: vine.enum(exerciceResultTypesValues),
})
