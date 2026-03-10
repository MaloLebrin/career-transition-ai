import vine from '@vinejs/vine'

export const registerValidator = vine.create({
  email: vine.string().trim().email().maxLength(255),
  password: vine.string().trim().minLength(6).maxLength(255),
  name: vine.string().trim().minLength(1).maxLength(255),
  organizationName: vine.string().trim().minLength(1).maxLength(255),
  // Seuls les comptes conseillers peuvent être créés via ce formulaire public
  role: vine.enum(['advisor'] as const),
})
