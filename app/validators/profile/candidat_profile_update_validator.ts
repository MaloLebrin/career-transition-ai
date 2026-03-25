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

  /**
   * Optional onboarding arrays.
   * Lenient on purpose: invalid/unparsable entries will be filtered server-side.
   */
  experiences: vine
    .array(
      vine.object({
        title: vine.string().trim().maxLength(255).optional(),
        company: vine.string().trim().maxLength(255).optional(),
        type: vine.string().trim().maxLength(30).optional(),
        startDate: vine.string().trim().maxLength(20).optional(),
        endDate: vine.string().trim().maxLength(20).nullable().optional(),
        isCurrent: vine.boolean().optional(),
        description: vine.string().trim().maxLength(5000).optional(),
      })
    )
    .optional(),

  educations: vine
    .array(
      vine.object({
        degree: vine.string().trim().maxLength(255).optional(),
        school: vine.string().trim().maxLength(255).optional(),
        startDate: vine.string().trim().maxLength(20).optional(),
        endDate: vine.string().trim().maxLength(20).nullable().optional(),
        isCurrent: vine.boolean().optional(),
        description: vine.string().trim().maxLength(5000).optional(),
      })
    )
    .optional(),

  skills: vine
    .array(
      vine.object({
        name: vine.string().trim().maxLength(255).optional(),
        level: vine.number().optional(),
      })
    )
    .optional(),
})
