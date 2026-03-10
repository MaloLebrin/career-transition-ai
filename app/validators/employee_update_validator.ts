import vine from '@vinejs/vine'

export const updateEmployeeValidator = vine.create({
  advisorNotes: vine.string().trim().maxLength(5000).optional(),
  status: vine.enum(['active', 'completed', 'on-hold'] as const).optional(),
  targetRole: vine.string().trim().maxLength(255).optional(),
  summary: vine.string().trim().maxLength(5000).optional(),
  name: vine.string().trim().maxLength(255).optional(),
  currentRole: vine.string().trim().maxLength(255).optional(),
  onboarded: vine.boolean().optional(),
  nextAppointment: vine.string().optional(),
})
