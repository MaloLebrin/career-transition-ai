import vine from '@vinejs/vine'
import { noteVisibilityValues } from '#shared/constants/note'

export const updateNoteValidator = vine.create(
  vine.object({
    content: vine.string().trim().minLength(1).optional(),
    visibility: vine.enum(noteVisibilityValues).optional(),
  })
)
