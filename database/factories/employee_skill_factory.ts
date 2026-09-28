import EmployeeSkill from '#models/employee_skill'
import factory from '@adonisjs/lucid/factories'

export const EmployeeSkillFactory = factory
  .define(EmployeeSkill, ({ faker }) => {
    return {
      employeeId: 0, // à surcharger
      skillId: 0, // à surcharger
      // Pas de CHECK en base (`smallint unsigned`) : bornes des validators `employee_skill/*`.
      level: faker.number.int({ min: 1, max: 5 }),
    }
  })
  .build()
