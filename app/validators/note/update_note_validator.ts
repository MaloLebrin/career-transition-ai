import vine from '@vinejs/vine'

export const updateNoteValidator = vine.compile(
  vine.object({
    content: vine.string().trim().minLength(1).optional(),
    visibility: vine.enum(['private', 'shared']).optional(),
  })
)
