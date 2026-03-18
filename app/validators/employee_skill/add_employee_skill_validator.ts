import vine from '@vinejs/vine'

export const addEmployeeSkillValidator = vine.create(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(255),
    category: vine.string().trim().minLength(1).maxLength(255).optional(),
    level: vine.number().in([1, 2, 3, 4, 5]),
  })
)

