import vine from '@vinejs/vine'

export const createEmployeeValidator = vine.compile(
  vine.object({
    name: vine.string().trim().maxLength(255),
    email: vine.string().trim().email().maxLength(255),
    currentRole: vine.string().trim().maxLength(255).optional(),
    targetRole: vine.string().trim().maxLength(255).optional(),
    summary: vine.string().trim().maxLength(5000).optional(),
  })
)
