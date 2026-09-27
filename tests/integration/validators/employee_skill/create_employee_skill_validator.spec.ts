import { test } from '@japa/runner'
import {
  createEmployeeSkillValidator,
  createEmployeeSkillsValidator,
} from '#validators/employee_skill/create_employee_skill_validator'
import { SkillFactory } from '#database/factories/skill_factory'

test.group('createEmployeeSkillValidator', () => {
  test('accepte une compétence existante et un niveau valide', async ({ assert }) => {
    const skill = await SkillFactory.create()
    const result = await createEmployeeSkillValidator.validate({ skillId: skill.id, level: 3 })
    assert.deepEqual(result, { skillId: skill.id, level: 3 })
  })

  test('rejette une compétence inexistante', async ({ assert }) => {
    await assert.rejects(() =>
      createEmployeeSkillValidator.validate({ skillId: 999_999_999, level: 3 })
    )
  })

  test('rejette un niveau hors de 1..5', async ({ assert }) => {
    const skill = await SkillFactory.create()
    await assert.rejects(() =>
      createEmployeeSkillValidator.validate({ skillId: skill.id, level: 7 })
    )
  })
})

test.group('createEmployeeSkillsValidator', () => {
  test('accepte une liste de compétences existantes', async ({ assert }) => {
    const [a, b] = await SkillFactory.createMany(2)
    const result = await createEmployeeSkillsValidator.validate({
      skills: [
        { skillId: a.id, level: 1 },
        { skillId: b.id, level: 5 },
      ],
    })
    assert.lengthOf(result.skills, 2)
  })

  test('accepte une liste vide', async ({ assert }) => {
    const result = await createEmployeeSkillsValidator.validate({ skills: [] })
    assert.deepEqual(result.skills, [])
  })

  test('rejette la liste si un élément référence une compétence inexistante', async ({
    assert,
  }) => {
    const skill = await SkillFactory.create()
    await assert.rejects(() =>
      createEmployeeSkillsValidator.validate({
        skills: [
          { skillId: skill.id, level: 2 },
          { skillId: 999_999_999, level: 2 },
        ],
      })
    )
  })
})
