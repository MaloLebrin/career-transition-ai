import { test } from '@japa/runner'
import { updateEmployeeSkillValidator } from '#validators/employee_skill/update_employee_skill_validator'
import EmployeeSkill from '#models/employee_skill'
import { SkillFactory } from '#database/factories/skill_factory'
import { createCandidate } from '#tests/support/actors'

async function seedEmployeeSkill() {
  const { employee } = await createCandidate()
  const skill = await SkillFactory.create()
  return EmployeeSkill.create({ employeeId: employee.id, skillId: skill.id, level: 2 })
}

test.group('updateEmployeeSkillValidator', () => {
  test('accepte une ligne employee_skills existante et un niveau valide', async ({ assert }) => {
    const row = await seedEmployeeSkill()
    const result = await updateEmployeeSkillValidator.validate({
      id: row.id,
      employeeSkillId: row.id,
      level: 4,
    })
    assert.deepEqual(result, { id: row.id, employeeSkillId: row.id, level: 4 })
  })

  test('rejette un identifiant employee_skills inexistant', async ({ assert }) => {
    const row = await seedEmployeeSkill()
    await assert.rejects(() =>
      updateEmployeeSkillValidator.validate({ id: 999_999_999, employeeSkillId: row.id, level: 4 })
    )
    await assert.rejects(() =>
      updateEmployeeSkillValidator.validate({ id: row.id, employeeSkillId: 999_999_999, level: 4 })
    )
  })

  test('rejette un niveau invalide', async ({ assert }) => {
    const row = await seedEmployeeSkill()
    await assert.rejects(() =>
      updateEmployeeSkillValidator.validate({ id: row.id, employeeSkillId: row.id, level: 0 })
    )
  })
})
