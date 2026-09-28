import { test } from '@japa/runner'
import OrganizationsController from '#controllers/organizations_controller'
import type { OrganizationDto } from '#dtos/organization_dto'
import Organization from '#models/organization'

type UpdateCall = { org: Organization; payload: { name?: string; slug?: string } }

class FakeOrganizationsService {
  public calls: Array<{ id: number }> = []
  public result: OrganizationDto | null = null
  public updateCalls: UpdateCall[] = []

  async getById(id: number): Promise<OrganizationDto | null> {
    this.calls.push({ id })
    return this.result
  }

  async update(
    org: Organization,
    payload: { name?: string; slug?: string }
  ): Promise<OrganizationDto> {
    this.updateCalls.push({ org, payload })
    return {
      id: org.id,
      name: payload.name ?? org.name,
      slug: payload.slug ?? org.slug,
      createdAt: org.createdAt.toISO() ?? '',
    }
  }
}

type InviteAdvisorCall = { organizationId: number; name: string; email: string; role: string }

class FakeAdvisorService {
  public inviteAdvisorCalls: InviteAdvisorCall[] = []
  public inviteAdvisorError: Error | null = null

  async inviteAdvisor(input: InviteAdvisorCall) {
    this.inviteAdvisorCalls.push(input)
    if (this.inviteAdvisorError) throw this.inviteAdvisorError
    return { id: 1, ...input }
  }
}

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
    status: '',
    redirectUrl,
    unauthorizedCalled: false,
    unauthorized() {
      this.unauthorizedCalled = true
      this.status = 'unauthorized'
      return this
    },
    redirect(url: string) {
      this.redirectUrl = url
      return this
    },
  }
}

test.group('OrganizationsController.updateFromDashboard', () => {
  test('returns 401 when user is not authenticated', async ({ assert }) => {
    const service = new FakeOrganizationsService()
    const controller = new OrganizationsController(service as any, new FakeAdvisorService() as any)
    const response = makeResponse()

    await controller.updateFromDashboard({
      auth: { user: null },
      request: {} as any,
      response: response as any,
      session: makeSession() as any,
    } as any)

    assert.isTrue(response.unauthorizedCalled)
    assert.lengthOf(service.updateCalls, 0)
  })

  test('calls service.update then redirects with flash', async ({ assert }) => {
    const org = await Organization.create({
      name: 'Original Name',
      slug: `org-update-${Date.now()}`,
      logoUrl: null,
    })

    const service = new FakeOrganizationsService()
    const controller = new OrganizationsController(service as any, new FakeAdvisorService() as any)
    const session = makeSession()
    const response = makeResponse()

    const payload = { name: 'Updated Cabinet', slug: 'updated-slug' }

    await controller.updateFromDashboard({
      auth: { user: { organizationId: org.id } },
      request: { validateUsing: () => Promise.resolve(payload) },
      response: response as any,
      session: session as any,
    } as any)

    assert.lengthOf(service.updateCalls, 1)
    assert.equal(service.updateCalls[0].org.id, org.id)
    assert.deepEqual(service.updateCalls[0].payload, payload)
    assert.deepEqual(session.flashes, [['success', 'Cabinet mis à jour.']])
    assert.equal(response.redirectUrl, '/dashboard/conseiller/settings')
  })
})

test.group('OrganizationsController.storeAdvisorFromDashboard', () => {
  test('returns 401 when user is not authenticated', async ({ assert }) => {
    const service = new FakeOrganizationsService()
    const advisorService = new FakeAdvisorService()
    const controller = new OrganizationsController(service as any, advisorService as any)
    const response = makeResponse()

    await controller.storeAdvisorFromDashboard({
      auth: { user: null },
      request: {} as any,
      response: response as any,
      session: makeSession() as any,
    } as any)

    assert.isTrue(response.unauthorizedCalled)
    assert.lengthOf(advisorService.inviteAdvisorCalls, 0)
  })

  test('calls service.inviteAdvisor then redirects with success flash', async ({ assert }) => {
    const service = new FakeOrganizationsService()
    const advisorService = new FakeAdvisorService()
    const controller = new OrganizationsController(service as any, advisorService as any)
    const session = makeSession()
    const response = makeResponse()

    const payload = {
      name: 'New Advisor',
      email: 'advisor@example.com',
      role: 'consultant' as const,
    }

    await controller.storeAdvisorFromDashboard({
      auth: { user: { organizationId: 42 } },
      request: {
        validateUsing: () => Promise.resolve(payload),
        protocol: () => 'https',
        hostname: () => 'example.test',
      },
      response: response as any,
      session: session as any,
    } as any)

    assert.lengthOf(advisorService.inviteAdvisorCalls, 1)
    assert.equal(advisorService.inviteAdvisorCalls[0].organizationId, 42)
    assert.equal(advisorService.inviteAdvisorCalls[0].name, payload.name)
    assert.equal(advisorService.inviteAdvisorCalls[0].email, payload.email)
    assert.equal(advisorService.inviteAdvisorCalls[0].role, payload.role)
    assert.deepEqual(session.flashes, [['success', 'Collaborateur invité.']])
    assert.equal(response.redirectUrl, '/dashboard/conseiller/settings')
  })

  test('on duplicate email sets error flash and redirects', async ({ assert }) => {
    const service = new FakeOrganizationsService()
    const advisorService = new FakeAdvisorService()
    advisorService.inviteAdvisorError = new Error(
      'Cet email est déjà utilisé par un compte existant.'
    )
    const controller = new OrganizationsController(service as any, advisorService as any)
    const session = makeSession()
    const response = makeResponse()

    const payload = {
      name: 'Dup',
      email: 'dup@example.com',
      role: 'consultant' as const,
    }

    await controller.storeAdvisorFromDashboard({
      auth: { user: { organizationId: 42 } },
      request: {
        validateUsing: () => Promise.resolve(payload),
        protocol: () => 'https',
        hostname: () => 'example.test',
      },
      response: response as any,
      session: session as any,
    } as any)

    assert.lengthOf(advisorService.inviteAdvisorCalls, 1)
    assert.deepEqual(session.flashes, [
      ['error', 'Cet email est déjà utilisé par un compte existant.'],
    ])
    assert.equal(response.redirectUrl, '/dashboard/conseiller/settings')
  })
})
