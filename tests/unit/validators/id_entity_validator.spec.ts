import { test } from '@japa/runner'
import { idEntityValidator } from '#validators/id_entity_validator'

test.group('idEntityValidator', () => {
  test('accepte un identifiant numérique', async ({ assert }) => {
    assert.deepEqual(await idEntityValidator.validate({ id: 42 }), { id: 42 })
  })

  test('convertit un identifiant numérique transmis en chaîne', async ({ assert }) => {
    assert.deepEqual(await idEntityValidator.validate({ id: '42' }), { id: 42 })
  })

  test("rejette l'absence d'identifiant", async ({ assert }) => {
    await assert.rejects(() => idEntityValidator.validate({}))
  })

  test('rejette un identifiant non numérique', async ({ assert }) => {
    await assert.rejects(() => idEntityValidator.validate({ id: 'abc' }))
  })
})
