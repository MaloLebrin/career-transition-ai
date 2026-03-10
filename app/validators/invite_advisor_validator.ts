import vine from '@vinejs/vine'

const advisorRoles = ['admin', 'expert', 'consultant'] as const

export const inviteAdvisorValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(255),
  email: vine.string().trim().email().maxLength(255),
  role: vine.enum(advisorRoles),
})
