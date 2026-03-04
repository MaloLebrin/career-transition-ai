import { test } from '@japa/runner'
import AuthController from '#controllers/auth_controller'
import { AuthService } from '#services/auth_service'
import User from '#models/user'
import Organization from '#models/organization'
import hash from '@adonisjs/core/services/hash'

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
    payload: undefined as any,
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
    json(data: any) {
      this.payload = data
      return this
    },
  }
}

test.group('AuthController.updateFromDashboard', () => {
  test('returns 401 when user is not authenticated', async ({ assert }) => {
    const service = new AuthService()
    const controller = new AuthController(service as any)
    const response = makeResponse()

    // @ts-expect-error minimal context
    await controller.updateFromDashboard({
      auth: { user: null },
      request: {} as any,
      response: response as any,
      session: makeSession() as any,
    })

    assert.isTrue(response.unauthorizedCalled)
  })

  test('updates profile and redirects with success flash', async ({ assert }) => {
    const org = await Organization.create({
      name: 'Profile Org',
      slug: `profile-org-${Date.now()}`,
    })

    const oldEmail = `old-profile-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@example.com`
    const newEmail = `new-profile-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@example.com`

    const user = await User.create({
      organizationId: org.id,
      email: oldEmail,
      name: 'Old Profile',
      password: await hash.make('secret123'),
      role: 'advisor',
    })

    const service = new AuthService()
    const controller = new AuthController(service as any)
    const session = makeSession()
    const response = makeResponse()

    // @ts-expect-error minimal context
    await controller.updateFromDashboard({
      auth: { user },
      request: {
        validateUsing: () =>
          Promise.resolve({
            name: 'New Profile',
            email: newEmail,
          }),
      },
      response: response as any,
      session: session as any,
    })

    await user.refresh()
    assert.equal(user.name, 'New Profile')
    assert.equal(user.email, newEmail)
    assert.deepEqual(session.flashes, [['success', 'Profil mis à jour.']])
    assert.equal(response.redirectUrl, '/dashboard/settings')
  })
})

