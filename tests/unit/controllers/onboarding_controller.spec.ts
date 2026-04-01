import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import OnboardingController from '#controllers/onboarding_controller'
import OnboardingToken from '#models/onboarding_token'
import Organization from '#models/organization'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'

function makeSession() {
  const flashes: Array<[string, string]> = []
  return {
    flashes,
    flash(key: string, value: string) {
      this.flashes.push([key, value])
    },
  }
}

function makeResponse() {
  let redirectUrl = ''
  return {
    statusCode: 200,
    redirectUrl,
    unauthorizedCalled: false,
    unauthorized() {
      this.unauthorizedCalled = true
      this.statusCode = 401
      return this
    },
    redirect(url: string) {
      this.redirectUrl = url
      return this
    },
  }
}

test.group('OnboardingController.submit', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('sets password, consumes token, logs in, and redirects to /dashboard', async ({ assert }) => {
    const org = await Organization.create({
      name: 'Onboarding Org',
      slug: `onboarding-org-${Date.now()}`,
      logoUrl: null,
    })

    const user = await User.create({
      organizationId: org.id,
      email: `onboarding-${Date.now()}@example.com`,
      name: 'Owner',
      password: await hash.make('temp-password-should-change'),
      role: 'admin',
    })

    const token = await OnboardingToken.createForUser(user.id)

    const controller = new OnboardingController()
    const response = makeResponse()
    const session = makeSession()
    const loginCalls: any[] = []

    // @ts-expect-error minimal context
    await controller.submit({
      params: { token: token.token },
      request: {
        validateUsing: () =>
          Promise.resolve({ password: 'new-password-1234', password_confirmation: 'new-password-1234' }),
      },
      response: response as any,
      auth: {
        use: () => ({
          login: async (u: any) => {
            loginCalls.push(u)
          },
        }),
      },
      session: session as any,
    })

    await user.refresh()
    await token.refresh()

    assert.lengthOf(loginCalls, 1)
    assert.equal(loginCalls[0].id, user.id)
    assert.isTrue(!!token.usedAt)
    assert.isTrue(DateTime.isDateTime(token.usedAt))
    assert.equal(response.redirectUrl, '/dashboard/conseiller')
    assert.deepEqual(session.flashes, [['success', 'Mot de passe créé. Bienvenue !']])
  })
})

