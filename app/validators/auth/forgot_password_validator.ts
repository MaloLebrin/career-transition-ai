import vine from '@vinejs/vine'

/** Demande de lien « mot de passe oublié » (#68). */
export const forgotPasswordValidator = vine.create({
  email: vine.string().trim().email().maxLength(255),
})
