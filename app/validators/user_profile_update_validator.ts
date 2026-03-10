import vine from '@vinejs/vine'

export const userProfileUpdateValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(255),
  email: vine.string().trim().email().maxLength(255),
})
