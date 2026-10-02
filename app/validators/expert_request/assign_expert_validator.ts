import vine from '@vinejs/vine'

/** Assignation d'un expert interne à une demande (#105). */
export const assignExpertValidator = vine.create({
  expertUserId: vine.number().positive(),
})
