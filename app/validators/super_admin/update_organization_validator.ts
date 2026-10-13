import vine from '@vinejs/vine'

/** Modification d'une organisation par le super admin : nom obligatoire, slug facultatif. */
export const superAdminUpdateOrganizationValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(255),
  slug: vine.string().trim().maxLength(100).optional(),
})
