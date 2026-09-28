import vine from '@vinejs/vine'

/** Le logo passe par `uploadOrganizationLogoValidator` (upload Cloudinary), plus de saisie libre. */
export const updateOrganizationValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(255).optional(),
  slug: vine.string().trim().maxLength(100).optional(),
})
