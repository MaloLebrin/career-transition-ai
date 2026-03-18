import vine from '@vinejs/vine'

export const createNoteValidator = vine.compile(
  vine.object({
    content: vine.string().trim().minLength(1),
    visibility: vine.enum(['private', 'shared']),
    supportPlanStepId: vine.number().positive().optional(),
    exerciseResultId: vine.number().positive().optional(),
  })
)
