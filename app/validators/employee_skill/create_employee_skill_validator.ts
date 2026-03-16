import vine from '@vinejs/vine'

export const createEmployeeSkillValidator = vine.create(
  vine.object({
    skillId: vine.number().exists({ table: 'skills', column: 'id' }),
    level: vine.number().in([1, 2, 3, 4, 5]),
  })
)

export const createEmployeeSkillsValidator = vine.create(
  vine.object({
    skills: vine.array(
      vine.object({
        skillId: vine.number().exists({ table: 'skills', column: 'id' }),
        level: vine.number().in([1, 2, 3, 4, 5]),
      })
    ),
  })
)
