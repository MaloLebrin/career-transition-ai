import { test } from '@japa/runner'
import { updateEmployeeSkillValidator } from '#validators/employee_skill/update_employee_skill_validator'

/**
 * L'appartenance de la ligne `employee_skills` au candidat est vérifiée par
 * `EmployeeSkillService.updateOwnEmployeeSkillLevel` (404), pas par le validateur.
 */
test.group('updateEmployeeSkillValidator', () => {
  test('accepte un identifiant de pivot et un niveau valide', async ({ assert }) => {
    const result = await updateEmployeeSkillValidator.validate({ id: 12, level: 4 })
    assert.deepEqual(result, { id: 12, level: 4 })
  })

  test('ignore le champ redondant employeeSkillId', async ({ assert }) => {
    const result = await updateEmployeeSkillValidator.validate({
      id: 12,
      employeeSkillId: 12,
      level: 4,
    })
    assert.deepEqual(result, { id: 12, level: 4 })
  })

  test('rejette un identifiant absent, non entier ou non positif', async ({ assert }) => {
    await assert.rejects(() => updateEmployeeSkillValidator.validate({ level: 4 }))
    await assert.rejects(() => updateEmployeeSkillValidator.validate({ id: 1.5, level: 4 }))
    await assert.rejects(() => updateEmployeeSkillValidator.validate({ id: 0, level: 4 }))
  })

  test('rejette un niveau invalide', async ({ assert }) => {
    await assert.rejects(() => updateEmployeeSkillValidator.validate({ id: 12, level: 0 }))
    await assert.rejects(() => updateEmployeeSkillValidator.validate({ id: 12, level: 6 }))
  })
})
