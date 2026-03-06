import { test } from '@japa/runner'
import { userProfileUpdateValidator } from '#validators/user_profile_update_validator'

test.group('userProfileUpdateValidator', () => {
  test('accepts valid payload', async ({ assert }) => {
    const result = await userProfileUpdateValidator.validate({
      name: 'Jean Dupont',
      email: 'jean@example.com',
    })

    assert.equal(result.name, 'Jean Dupont')
    assert.equal(result.email, 'jean@example.com')
  })

  test('rejects invalid email', async ({ assert }) => {
    await assert.rejects(() =>
      userProfileUpdateValidator.validate({
        name: 'Jean Dupont',
        email: 'not-an-email',
      })
    )
  })

  test('rejects missing name', async ({ assert }) => {
    await assert.rejects(() =>
      userProfileUpdateValidator.validate({
        email: 'jean@example.com',
      } as any)
    )
  })
})
