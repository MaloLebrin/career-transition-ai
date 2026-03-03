import vine from '@vinejs/vine'

export const updateOrganizationValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(255).optional(),
    slug: vine.string().trim().maxLength(100).optional(),
    logoUrl: vine.string().trim().maxLength(512).optional(),
  })
)
