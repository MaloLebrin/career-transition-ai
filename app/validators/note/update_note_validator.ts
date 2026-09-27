import vine from '@vinejs/vine'
import { noteVisibilityValues } from '#shared/constants/note'

export const updateNoteValidator = vine.compile(
  vine.object({
    content: vine.string().trim().minLength(1).optional(),
    visibility: vine.enum(noteVisibilityValues).optional(),
  })
)
