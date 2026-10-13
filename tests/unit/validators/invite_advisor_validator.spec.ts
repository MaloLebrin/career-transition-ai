import { test } from '@japa/runner'
import { inviteAdvisorValidator } from '#validators/user/invite_advisor_validator'

test.group('inviteAdvisorValidator', () => {
  test('accepts valid payload', async ({ assert }) => {
    const data = {
      name: 'Jane Advisor',
      email: 'jane@example.com',
      role: 'advisor' as const,
    }
    const result = await inviteAdvisorValidator.validate(data)
    assert.equal(result.name, 'Jane Advisor')
    assert.equal(result.email, 'jane@example.com')
    assert.equal(result.role, 'advisor')
  })

  test('rejects invalid email', async ({ assert }) => {
    const data = {
      name: 'Jane',
      email: 'not-an-email',
      role: 'advisor' as const,
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

  test('rejette les rôles hors du cabinet (consultant, expert, super_admin)', async ({
    assert,
  }) => {
    for (const role of ['consultant', 'expert', 'super_admin']) {
      await assert.rejects(() =>
        inviteAdvisorValidator.validate({ name: 'J', email: 'j@example.com', role } as any)
      )
    }
  })
})
