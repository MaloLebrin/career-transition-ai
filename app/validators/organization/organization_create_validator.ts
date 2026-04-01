import vine from '@vinejs/vine'

export const createOrganizationValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(255),
  slug: vine.string().trim().maxLength(100).optional(),
  ownerName: vine.string().trim().minLength(1).maxLength(255),
  ownerEmail: vine.string().trim().email().maxLength(255),
})
