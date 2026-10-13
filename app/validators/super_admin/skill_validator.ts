import vine from '@vinejs/vine'

/** Création / modification d'une compétence du catalogue global. */
export const skillValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(120),
  category: vine.string().trim().maxLength(80).nullable().optional(),
})
