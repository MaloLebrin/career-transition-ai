import { test } from '@japa/runner'
import { loginValidator } from '#validators/auth_login_validator'

test.group('loginValidator', () => {
  test('accepts valid payload', async ({ assert }) => {
    const payload = {
      email: 'user@example.com',
      password: 'secret123',
    }

    const result = await loginValidator.validate(payload)
    assert.equal(result.email, payload.email)
    assert.equal(result.password, payload.password)
  })

  test('rejects invalid email', async ({ assert }) => {
    const payload = {
      email: 'not-an-email',
      password: 'secret123',
    }

    try {
      await loginValidator.validate(payload)
      assert.fail('Expected validation to fail')
    } catch (error: any) {
      assert.exists(error.messages)
    }
  })
})

