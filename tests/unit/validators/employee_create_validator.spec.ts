import { test } from '@japa/runner'
import { createEmployeeValidator } from '#validators/employee/employee_create_validator'

test.group('createEmployeeValidator', () => {
  test('accepts valid payload with required fields only', async ({ assert }) => {
    const payload = {
      name: 'Jean Dupont',
      email: 'jean.dupont@example.com',
    }
    const result = await createEmployeeValidator.validate(payload)
    assert.equal(result.name, 'Jean Dupont')
    assert.equal(result.email, 'jean.dupont@example.com')
    assert.isUndefined(result.currentRole)
    assert.isUndefined(result.targetRole)
    assert.isUndefined(result.summary)
  })

  test('accepts valid payload with all optional fields', async ({ assert }) => {
    const payload = {
      name: 'Marie Martin',
      email: 'marie@example.com',
      currentRole: 'Developpeuse',
      targetRole: 'Tech Lead',
      summary: '10 ans experience.',
    }
    const result = await createEmployeeValidator.validate(payload)
    assert.equal(result.name, payload.name)
    assert.equal(result.email, payload.email)
    assert.equal(result.currentRole, payload.currentRole)
    assert.equal(result.targetRole, payload.targetRole)
    assert.equal(result.summary, payload.summary)
  })

  test('trims string fields', async ({ assert }) => {
    const payload = {
      name: '  Jean Dupont  ',
      email: '  jean@example.com  ',
    }
    const result = await createEmployeeValidator.validate(payload)
    assert.equal(result.name, 'Jean Dupont')
    assert.equal(result.email, 'jean@example.com')
  })

  test('rejects missing name', async ({ assert }) => {
    const payload = {
      email: 'jean@example.com',
    }
    await assert.rejects(() => createEmployeeValidator.validate(payload as any))
  })

  test('rejects missing email', async ({ assert }) => {
    const payload = {
      name: 'Jean Dupont',
    }
    await assert.rejects(() => createEmployeeValidator.validate(payload as any))
  })

  test('rejects invalid email', async ({ assert }) => {
    const payload = {
      name: 'Jean Dupont',
      email: 'not-an-email',
    }
    await assert.rejects(() => createEmployeeValidator.validate(payload))
  })
})
