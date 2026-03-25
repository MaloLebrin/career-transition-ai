import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import CandidatOnboardingController from '#controllers/candidat_onboarding_controller'

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

test.group('CandidatOnboardingController.complete', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 401 when user is not authenticated', async ({ assert }) => {
    const controller = new CandidatOnboardingController({ updateForUser: async () => ({}) } as any)
    const response = makeResponse()

    // @ts-expect-error minimal context
    await controller.complete({
      auth: { user: null },
      request: {} as any,
      response: response as any,
      session: makeSession() as any,
    })

    assert.isTrue(response.unauthorizedCalled)
  })

  test('marks onboarding complete via service and redirects', async ({ assert }) => {
    const calls: any[] = []
    const controller = new CandidatOnboardingController({
      updateForUser: async (...args: any[]) => {
        calls.push(args)
        return {}
      },
    } as any)

    const response = makeResponse()
    const session = makeSession()

    // @ts-expect-error minimal context
    await controller.complete({
      auth: { user: { id: 1 } },
      request: { validateUsing: () => Promise.resolve({ currentRole: 'Dev' }) },
      response: response as any,
      session: session as any,
    })

    assert.equal(calls.length, 1)
    assert.equal(response.redirectUrl, '/dashboard/candidat')
    assert.deepEqual(session.flashes, [['success', 'Onboarding terminé. Bienvenue !']])
  })
})

