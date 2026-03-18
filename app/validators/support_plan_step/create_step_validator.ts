import vine from '@vinejs/vine'
import { exerciceResultTypesValues } from '#models/exercise_result'
import { appointmentStatusValues } from '#shared/constants/appointment'

export const createStepValidator = vine.compile(
  vine.object({
    title: vine.string().trim().maxLength(255).nullable().optional(),
    description: vine.string().trim().nullable().optional(),
    instructions: vine.string().trim().nullable().optional(),
    dueDate: vine.string().nullable().optional(),
    scheduledAt: vine.string().nullable().optional(),
    status: vine.enum(appointmentStatusValues).optional(),
    locationOrLink: vine.string().maxLength(512).nullable().optional(),
    associatedExercises: vine
      .array(vine.enum(exerciceResultTypesValues))
      .optional(),
    sortOrder: vine.number().optional(),
    isLocked: vine.boolean().optional(),
  })
)
