import vine from '@vinejs/vine'

export const updateSkillValidator = vine.create({
  id: vine.number(),
  name: vine.string().trim().minLength(1).maxLength(255),
  category: vine.string().trim().minLength(1).maxLength(255),
})
