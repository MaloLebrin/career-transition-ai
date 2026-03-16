import vine from '@vinejs/vine'

export const idEntityValidator = vine.create({
  id: vine.number(),
})
