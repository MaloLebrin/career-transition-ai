import vine from '@vinejs/vine'

export const updateEmployeeSkillValidator = vine.create(
  vine.object({
    id: vine.number().exists({ table: 'employee_skills', column: 'id' }),
    level: vine.number().in([1, 2, 3, 4, 5]),
    employeeSkillId: vine.number().exists({ table: 'employee_skills', column: 'id' }),
  })
)

export const updateEmployeeSkillsValidator = vine.create(
  vine.object({
    skills: vine.array(
      vine.object({
        id: vine.number().exists({ table: 'employee_skills', column: 'id' }),
        level: vine.number().in([1, 2, 3, 4, 5]),
      })
    ),
  })
)
