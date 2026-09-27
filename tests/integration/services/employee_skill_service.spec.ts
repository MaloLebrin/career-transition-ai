import { test } from '@japa/runner'
import EmployeeSkill from '#models/employee_skill'
import { EmployeeSkillService } from '#services/employee_skill_service'
import { SkillFactory } from '#database/factories/skill_factory'
import { createCandidate } from '#tests/support/actors'

test.group('EmployeeSkillService', () => {
  test('updateEmployeeSkillLevel crée la ligne pivot si elle est absente', async ({ assert }) => {
    const { employee } = await createCandidate()
    const skill = await SkillFactory.create()

    const row = await new EmployeeSkillService().updateEmployeeSkillLevel({
      employeeId: employee.id,
      skillId: skill.id,
      level: 2,
    })

    const rows = await EmployeeSkill.query().where('employee_id', employee.id)
    assert.lengthOf(rows, 1)
    assert.equal(rows[0].id, row.id)
    assert.equal(rows[0].skillId, skill.id)
    assert.equal(rows[0].level, 2)
  })

  test('updateEmployeeSkillLevel met à jour le niveau sans dupliquer la ligne', async ({
    assert,
  }) => {
    const { employee } = await createCandidate()
    const skill = await SkillFactory.create()
    const service = new EmployeeSkillService()

    const first = await service.updateEmployeeSkillLevel({
      employeeId: employee.id,
      skillId: skill.id,
      level: 2,
    })
    const second = await service.updateEmployeeSkillLevel({
      employeeId: employee.id,
      skillId: skill.id,
      level: 5,
    })

    assert.equal(second.id, first.id)
    const rows = await EmployeeSkill.query().where('employee_id', employee.id)
    assert.lengthOf(rows, 1)
    assert.equal(rows[0].level, 5)
  })

  test("updateEmployeeSkillLevel n'affecte pas les autres candidats", async ({ assert }) => {
    const { employee: a } = await createCandidate()
    const { employee: b } = await createCandidate()
    const skill = await SkillFactory.create()
    const service = new EmployeeSkillService()

    await service.updateEmployeeSkillLevel({ employeeId: a.id, skillId: skill.id, level: 1 })
    await service.updateEmployeeSkillLevel({ employeeId: b.id, skillId: skill.id, level: 4 })

    const rowA = await EmployeeSkill.query().where('employee_id', a.id).firstOrFail()
    const rowB = await EmployeeSkill.query().where('employee_id', b.id).firstOrFail()
    assert.equal(rowA.level, 1)
    assert.equal(rowB.level, 4)
  })

  test('syncSkills crée et met à jour chaque compétence fournie', async ({ assert }) => {
    const { employee } = await createCandidate()
    const [existing, added] = await SkillFactory.createMany(2)
    await EmployeeSkill.create({ employeeId: employee.id, skillId: existing.id, level: 1 })

    await new EmployeeSkillService().syncSkills(employee.id, [
      { skillId: existing.id, level: 3 },
      { skillId: added.id, level: 5 },
    ])

    const rows = await EmployeeSkill.query().where('employee_id', employee.id).orderBy('skill_id')
    assert.deepEqual(
      rows.map((r) => ({ skillId: r.skillId, level: r.level })),
      [
        { skillId: existing.id, level: 3 },
        { skillId: added.id, level: 5 },
      ].sort((x, y) => x.skillId - y.skillId)
    )
  })

  test('syncSkills avec une liste vide ne touche à rien', async ({ assert }) => {
    const { employee } = await createCandidate()
    const skill = await SkillFactory.create()
    await EmployeeSkill.create({ employeeId: employee.id, skillId: skill.id, level: 2 })

    await new EmployeeSkillService().syncSkills(employee.id, [])

    const rows = await EmployeeSkill.query().where('employee_id', employee.id)
    assert.lengthOf(rows, 1)
    assert.equal(rows[0].level, 2)
  })
})
