import vine from '@vinejs/vine'

/** Changement de mot de passe d'un utilisateur connecté (#68). */
export const changePasswordValidator = vine.create({
  current_password: vine.string().trim().minLength(1).maxLength(255),
  password: vine.string().trim().minLength(8).maxLength(255).notSameAs('current_password'),
  password_confirmation: vine.string().trim().sameAs('password'),
})
