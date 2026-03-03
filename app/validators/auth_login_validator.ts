import vine from '@vinejs/vine'

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email().maxLength(255),
    password: vine.string().trim().minLength(6).maxLength(255),
  })
)

