import vine from '@vinejs/vine'
import { exerciceResultTypesValues } from '#models/exercise_result'
import { appointmentStatusValues } from '#shared/constants/appointment'

export const updateStepValidator = vine.compile(
  vine.object({
    title: vine.string().trim().maxLength(255).nullable().optional(),
    description: vine.string().trim().nullable().optional(),
    instructions: vine.string().trim().nullable().optional(),
    dueDate: vine.string().nullable().optional(),
    scheduledAt: vine.string().nullable().optional(),
    endedAt: vine.string().nullable().optional(),
    status: vine.enum(appointmentStatusValues).optional(),
    locationOrLink: vine.string().maxLength(512).nullable().optional(),
    associatedExercise: vine.enum(exerciceResultTypesValues).nullable().optional(),
    sortOrder: vine.number().optional(),
    isLocked: vine.boolean().optional(),
    completed: vine.boolean().optional(),
    notes: vine.string().nullable().optional(),
  })
)
