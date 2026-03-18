import vine from '@vinejs/vine'
import { exerciceResultTypesValues } from '#models/exercise_result'

export const createStepValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1).maxLength(255),
    description: vine.string().trim().nullable().optional(),
    dueDate: vine.string(),
    associatedExercise: vine.enum(exerciceResultTypesValues).nullable().optional(),
    sortOrder: vine.number().positive().optional(),
    isLocked: vine.boolean().optional(),
  })
)
