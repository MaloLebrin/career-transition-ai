import vine from '@vinejs/vine'
import { userRolesValues } from '#models/user'

export const registerValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email().maxLength(255),
    password: vine.string().trim().minLength(6).maxLength(255),
    name: vine.string().trim().minLength(1).maxLength(255),
    role: vine.enum(userRolesValues),
  })
)

