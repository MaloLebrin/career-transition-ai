import vine from '@vinejs/vine'

export const userProfileUpdateValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(255),
    email: vine.string().trim().email().maxLength(255),
  })
)
