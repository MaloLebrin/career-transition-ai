import vine from '@vinejs/vine'

export const createContactRequestValidator = vine.create({
  name: vine.string().trim().minLength(2).maxLength(255),
  email: vine.string().trim().email().maxLength(255),
  phone: vine.string().trim().maxLength(50).optional(),
  organization: vine.string().trim().maxLength(255).optional(),
  message: vine.string().trim().minLength(10).maxLength(2000),
  type: vine.enum(['contact', 'demo'] as const),
})
