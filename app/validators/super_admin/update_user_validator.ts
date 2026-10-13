import vine from '@vinejs/vine'

/** Modification du nom et de l'e-mail d'un utilisateur par le super admin. */
export const superAdminUpdateUserValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(255),
  email: vine.string().trim().email().maxLength(255),
})
