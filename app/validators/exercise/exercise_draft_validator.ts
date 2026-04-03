import { EXERCICE_RESULTS_TYPES } from '#shared/constants/exercises'
import vine from '@vinejs/vine'

export const saveExerciseDraftValidator = vine.create({
  employeeId: vine.string(),
  type: vine.enum(EXERCICE_RESULTS_TYPES),
  data: vine.object({}).allowUnknownProperties(),
})
