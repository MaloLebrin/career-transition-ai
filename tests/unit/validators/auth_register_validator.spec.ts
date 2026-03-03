import { test } from '@japa/runner'
import { registerValidator } from '#validators/auth_register_validator'

test.group('registerValidator', () => {
  test('accepts valid payload', async ({ assert }) => {
    const payload = {
      email: 'user@example.com',
      password: 'secret123',
      name: 'Test User',
      role: 'advisor',
    }

    const result = await registerValidator.validate(payload)
    assert.equal(result.email, payload.email)
    assert.equal(result.password, payload.password)
    assert.equal(result.name, payload.name)
    assert.equal(result.role, payload.role)
  })

  test('rejects missing password', async ({ assert }) => {
    try {
      // @ts-ignore Intentionally passing an invalid payload to test validation errors
      await registerValidator.validate({
        email: 'user@example.com',
        name: 'Test User',
        role: 'advisor',
      })
      assert.fail('Expected validation to fail')
    } catch (error: any) {
      assert.exists(error.messages)
    }
  })
})

