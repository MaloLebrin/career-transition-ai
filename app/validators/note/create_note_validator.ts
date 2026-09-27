import vine from '@vinejs/vine'
import { noteVisibilityValues } from '#shared/constants/note'

export const createNoteValidator = vine.create(
  vine.object({
    content: vine.string().trim().minLength(1),
    visibility: vine.enum(noteVisibilityValues),
    supportPlanStepId: vine.number().positive().optional(),
    exerciseResultId: vine.number().positive().optional(),
  })
)
