import { test } from '@japa/runner'
import OnboardingToken from '#models/onboarding_token'
import User from '#models/user'
import Organization from '#models/organization'
import hash from '@adonisjs/core/services/hash'
import { sendOnboardingEmail } from '#services/onboarding_notify_service'

test.group('sendOnboardingEmail', () => {
  test('sends via MailService (should not throw)', async ({ assert }) => {
    const org = await Organization.create({
      name: 'Mail Org',
      slug: `mail-org-${Date.now()}`,
      logoUrl: null,
    })

    const user = await User.create({
      organizationId: org.id,
      email: `mail-${Date.now()}@example.com`,
      name: 'Mail User',
      password: await hash.make('secret123'),
      role: 'employee',
    })

    const token = await OnboardingToken.createForUser(user.id)

    await sendOnboardingEmail(user, token, 'http://localhost')
    assert.isTrue(true)
  })
})

