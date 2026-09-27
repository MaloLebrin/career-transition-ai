import { test } from '@japa/runner'
import { addEmployeeSkillValidator } from '#validators/employee_skill/add_employee_skill_validator'

test.group('addEmployeeSkillValidator', () => {
  test('accepte un nom, une catégorie et un niveau valides', async ({ assert }) => {
    const result = await addEmployeeSkillValidator.validate({
      name: '  TypeScript ',
      category: ' Technique ',
      level: 4,
    })

    assert.deepEqual(result, { name: 'TypeScript', category: 'Technique', level: 4 })
  })

  test('accepte une catégorie absente', async ({ assert }) => {
    const result = await addEmployeeSkillValidator.validate({ name: 'Leadership', level: 1 })
    assert.isUndefined(result.category)
  })

  test('accepte chaque niveau de 1 à 5', async ({ assert }) => {
    for (const level of [1, 2, 3, 4, 5]) {
      const result = await addEmployeeSkillValidator.validate({ name: 'React', level })
      assert.equal(result.level, level)
    }
  })

  test('rejette un niveau hors de 1..5', async ({ assert }) => {
    for (const level of [0, 6, 2.5]) {
      await assert.rejects(() => addEmployeeSkillValidator.validate({ name: 'React', level }))
    }
  })

  test('rejette un nom vide', async ({ assert }) => {
    await assert.rejects(() => addEmployeeSkillValidator.validate({ name: '  ', level: 3 }))
  })

  test('rejette un nom trop long', async ({ assert }) => {
    await assert.rejects(() =>
      addEmployeeSkillValidator.validate({ name: 'x'.repeat(256), level: 3 })
    )
  })

  test('rejette une catégorie vide si fournie', async ({ assert }) => {
    await assert.rejects(() =>
      addEmployeeSkillValidator.validate({ name: 'React', category: '', level: 3 })
    )
  })
})
