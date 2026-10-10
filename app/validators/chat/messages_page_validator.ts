import vine from '@vinejs/vine'

/** Curseur de pagination du chat : `?before=<id du plus ancien message affiché>`. */
export const chatMessagesPageValidator = vine.create({
  before: vine.number().withoutDecimals().positive().optional(),
})
