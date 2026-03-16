import vine from '@vinejs/vine'

/**
 * Payload for PUT /dashboard/candidat/profile (user + linked employee fields).
 */
export const candidatProfileUpdateValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(255).optional(),
  email: vine.string().trim().email().maxLength(255).optional(),
  currentRole: vine.string().trim().maxLength(255).optional(),
  targetRole: vine.string().trim().maxLength(255).optional(),
  summary: vine.string().trim().maxLength(5000).optional(),
  onboarded: vine.boolean().optional(),
})
