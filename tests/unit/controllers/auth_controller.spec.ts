import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import AuthController from '#controllers/auth_controller'
import { AuthService } from '#services/auth_service'
import User from '#models/user'
import Organization from '#models/organization'
import hash from '@adonisjs/core/services/hash'

const fakeEmployeesService = { getEmployeeForUser: async () => ({}), applyUpdate: () => {} } as any

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
    forbiddenCalled: false,
    unauthorized() {
      this.unauthorizedCalled = true
      this.statusCode = 401
      return this
    },
    forbidden() {
      this.forbiddenCalled = true
      this.statusCode = 403
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

test.group('AuthController.updateFromDashboard', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  test('returns 401 when user is not authenticated', async ({ assert }) => {
    const service = new AuthService()
    const controller = new AuthController(service as any, fakeEmployeesService)
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
    const controller = new AuthController(service as any, fakeEmployeesService)
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
    assert.equal(response.redirectUrl, '/dashboard/conseiller/settings')
  })
})

test.group('AuthController super admin actions', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  test('impersonate returns 401 when not authenticated', async ({ assert }) => {
    const controller = new AuthController({} as any)
    const response = makeResponse()

    // @ts-expect-error minimal context
    await controller.impersonate({
      auth: { user: null },
      params: { id: 1 },
      response: response as any,
      session: makeSession() as any,
    })

    assert.isTrue(response.unauthorizedCalled)
  })

  test('impersonate returns 403 when not super admin', async ({ assert }) => {
    const org = await Organization.create({
      name: 'Org',
      slug: `org-${Date.now()}`,
    })

    const user = await User.create({
      organizationId: org.id,
      email: 'user@example.com',
      name: 'User',
      password: await hash.make('secret123'),
      role: 'advisor',
    })

    const controller = new AuthController({} as any)
    const response = makeResponse()

    // @ts-expect-error minimal context
    const result = await controller.impersonate({
      auth: { user },
      params: { id: 999 },
      response: response as any,
      session: makeSession() as any,
    })

    assert.isTrue(response.forbiddenCalled)
    assert.equal(response.statusCode, 403)
  })

  test('resetPassword returns 401 when not authenticated', async ({ assert }) => {
    const controller = new AuthController({} as any)
    const response = makeResponse()

    // @ts-expect-error minimal context
    await controller.resetPassword({
      auth: { user: null },
      params: { id: 1 },
      response: response as any,
      session: makeSession() as any,
    })

    assert.isTrue(response.unauthorizedCalled)
  })
})
