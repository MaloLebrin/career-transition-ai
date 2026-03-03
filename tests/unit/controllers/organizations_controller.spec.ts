import { test } from '@japa/runner'
import OrganizationsController from '#controllers/organizations_controller'
import type { OrganizationDto } from '#dtos/organization_dto'

class FakeOrganizationsService {
  public calls: Array<{ id: number }> = []
  public result: OrganizationDto | null = null

  async getById(id: number): Promise<OrganizationDto | null> {
    this.calls.push({ id })
    return this.result
  }
}

function makeResponse() {
  return {
    status: '',
    payload: undefined as any,
    unauthorizedCalled: false,
    notFoundCalled: false,
    unauthorized() {
      this.unauthorizedCalled = true
      this.status = 'unauthorized'
      return this
    },
    notFound() {
      this.notFoundCalled = true
      this.status = 'notFound'
      return this
    },
    json(data: any) {
      this.payload = data
      this.status = 'ok'
      return this
    },
  }
}

test.group('OrganizationsController.current', () => {
  test('returns 401 when user is not authenticated', async ({ assert }) => {
    const service = new FakeOrganizationsService()
    const controller = new OrganizationsController(service as any)
    const response = makeResponse()

    // @ts-expect-error minimal HttpContext shape for the test
    await controller.current({ auth: { user: null }, response })

    assert.isTrue(response.unauthorizedCalled)
    assert.equal(response.status, 'unauthorized')
  })

  test('returns 404 when organization does not exist', async ({ assert }) => {
    const service = new FakeOrganizationsService()
    service.result = null
    const controller = new OrganizationsController(service as any)
    const response = makeResponse()

    // @ts-expect-error minimal HttpContext shape for the test
    await controller.current({ auth: { user: { organizationId: 123 } }, response })

    assert.isTrue(response.notFoundCalled)
    assert.equal(response.status, 'notFound')
    assert.deepEqual(service.calls, [{ id: 123 }])
  })

  test('returns organization dto when it exists', async ({ assert }) => {
    const service = new FakeOrganizationsService()
    service.result = {
      id: '1',
      name: 'Test Org',
      slug: 'test-org',
      createdAt: '2025-01-01T00:00:00.000Z',
    }
    const controller = new OrganizationsController(service as any)
    const response = makeResponse()

    // @ts-expect-error minimal HttpContext shape for the test
    await controller.current({ auth: { user: { organizationId: 1 } }, response })

    assert.equal(response.status, 'ok')
    assert.deepEqual(response.payload, service.result)
    assert.deepEqual(service.calls, [{ id: 1 }])
  })
})

