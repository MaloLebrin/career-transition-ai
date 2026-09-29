import vine from '@vinejs/vine'

/** Nouveau mot de passe choisi depuis un lien « mot de passe oublié » (#68). */
export const resetPasswordValidator = vine.create({
  password: vine.string().trim().minLength(8).maxLength(255),
  password_confirmation: vine.string().trim().sameAs('password'),
})
