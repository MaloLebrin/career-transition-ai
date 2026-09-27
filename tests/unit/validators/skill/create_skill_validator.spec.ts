import { test } from '@japa/runner'
import { createSkillValidator } from '#validators/skill/create_skill_validator'

test.group('createSkillValidator', () => {
  test('accepte un nom et une catégorie', async ({ assert }) => {
    const result = await createSkillValidator.validate({
      name: ' Négociation ',
      category: 'Commercial',
    })
    assert.deepEqual(result, { name: 'Négociation', category: 'Commercial' })
  })

  test('rejette un nom vide', async ({ assert }) => {
    await assert.rejects(() => createSkillValidator.validate({ name: '', category: 'Commercial' }))
  })

  test('rejette une catégorie absente', async ({ assert }) => {
    await assert.rejects(() => createSkillValidator.validate({ name: 'Négociation' } as any))
  })

  test('rejette des valeurs de plus de 255 caractères', async ({ assert }) => {
    await assert.rejects(() =>
      createSkillValidator.validate({ name: 'x'.repeat(256), category: 'Commercial' })
    )
    await assert.rejects(() =>
      createSkillValidator.validate({ name: 'Négociation', category: 'x'.repeat(256) })
    )
  })
})
