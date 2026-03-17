import { test } from '@japa/runner'
import { inviteAdvisorValidator } from '#validators/user/invite_advisor_validator'

test.group('inviteAdvisorValidator', () => {
  test('accepts valid payload', async ({ assert }) => {
    const data = {
      name: 'Jane Advisor',
      email: 'jane@example.com',
      role: 'expert' as const,
    }
    const result = await inviteAdvisorValidator.validate(data)
    assert.equal(result.name, 'Jane Advisor')
    assert.equal(result.email, 'jane@example.com')
    assert.equal(result.role, 'expert')
  })

  test('rejects invalid email', async ({ assert }) => {
    const data = {
      name: 'Jane',
      email: 'not-an-email',
      role: 'expert' as const,
    }
    await assert.rejects(() => inviteAdvisorValidator.validate(data))
  })

  test('rejects invalid role', async ({ assert }) => {
    const data: any = {
      name: 'Jane',
      email: 'jane@example.com',
      role: 'invalid',
    }
    await assert.rejects(() => inviteAdvisorValidator.validate(data))
  })
})
