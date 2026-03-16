import vine from '@vinejs/vine'

export const createSkillValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(255),
  category: vine.string().trim().minLength(1).maxLength(255),
})
