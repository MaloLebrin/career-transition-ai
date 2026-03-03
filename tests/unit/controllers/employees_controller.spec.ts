import { test } from '@japa/runner'
import EmployeesController from '#controllers/employees_controller'
import type { EmployeeDto } from '#dtos/employee_dto'
import { EmployeesService } from '#services/employees_service'
import Employee from '#models/employee'
import Organization from '#models/organization'

type CreateInput = {
  organizationId: number
  advisorId: number | null
  name: string
  email: string
  currentRole?: string
  targetRole?: string
  summary?: string
}

class FakeEmployeesService {
  public createCalls: CreateInput[] = []
  public applyUpdateCalls: Array<{ payload: Record<string, unknown> }> = []

  async create(input: CreateInput): Promise<EmployeeDto> {
    this.createCalls.push(input)
    return {
      id: 1,
      organizationId: input.organizationId,
      name: input.name,
      email: input.email,
      currentRole: input.currentRole ?? '',
      targetRole: input.targetRole ?? undefined,
      summary: input.summary ?? undefined,
      status: 'active',
      onboarded: false,
      experiences: [],
      educations: [],
      skills: [],
      exercises: [],
      plan: [],
      advisorNotes: undefined,
      nextAppointment: undefined,
    }
  }

  applyUpdate(_employee: any, payload: Record<string, unknown>): any {
    this.applyUpdateCalls.push({ payload })
    return _employee
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
    redirectUrl,
    unauthorizedCalled: false,
    unauthorized() {
      this.unauthorizedCalled = true
      return this
    },
    redirect(url: string) {
      this.redirectUrl = url
      return this
    },
  }
}

test.group('EmployeesController.storeFromDashboard', () => {
  test('returns 401 when user is not authenticated', async ({ assert }) => {
    const service = new FakeEmployeesService()
    const controller = new EmployeesController(service as any)
    const response = makeResponse()

    await controller.storeFromDashboard({
      auth: { user: null },
      request: {} as any,
      response: response as any,
      session: makeSession() as any,
    } as any)

    assert.isTrue(response.unauthorizedCalled)
    assert.lengthOf(service.createCalls, 0)
  })

  test('calls service.create with payload and user context then redirects with flash', async ({
    assert,
  }) => {
    const service = new FakeEmployeesService()
    const controller = new EmployeesController(service as any)
    const session = makeSession()
    const response = makeResponse()

    const payload = {
      name: 'Jean Dupont',
      email: 'jean@example.com',
      currentRole: 'Dev',
    }

    await controller.storeFromDashboard({
      auth: { user: { id: 10, organizationId: 5 } },
      request: {
        validateUsing: () => Promise.resolve(payload),
      },
      response: response as any,
      session: session as any,
    } as any)

    assert.lengthOf(service.createCalls, 1)
    assert.equal(service.createCalls[0].organizationId, 5)
    assert.equal(service.createCalls[0].advisorId, 10)
    assert.equal(service.createCalls[0].name, payload.name)
    assert.equal(service.createCalls[0].email, payload.email)
    assert.equal(service.createCalls[0].currentRole, payload.currentRole)
    assert.deepEqual(session.flashes, [['success', 'Candidat ajouté.']])
    assert.equal(response.redirectUrl, '/dashboard/employees')
  })
})

test.group('EmployeesController.updateFromDashboard', () => {
  test('returns 401 when user is not authenticated', async ({ assert }) => {
    const service = new FakeEmployeesService()
    const controller = new EmployeesController(service as any)
    const response = makeResponse()

    await controller.updateFromDashboard({
      params: { id: '1' },
      auth: { user: null },
      request: {} as any,
      response: response as any,
      session: makeSession() as any,
    } as any)

    assert.isTrue(response.unauthorizedCalled)
  })

  test('updates employee and redirects with flash', async ({ assert }) => {
    const org = await Organization.create({
      name: 'Test Org Update',
      slug: `test-org-update-${Date.now()}`,
      logoUrl: null,
    })

    const employee = await Employee.create({
      organizationId: org.id,
      advisorId: null,
      userId: null,
      name: 'Jane Doe',
      email: `jane-update-${Date.now()}@example.com`,
      currentRole: 'Dev',
      targetRole: 'Lead',
      summary: null,
      advisorNotes: 'Old notes',
      status: 'active',
      onboarded: false,
      nextAppointment: null,
    })

    const service = new EmployeesService()
    const controller = new EmployeesController(service)
    const session = makeSession()
    const response = makeResponse()

    await controller.updateFromDashboard({
      params: { id: String(employee.id) },
      auth: { user: { id: 1, organizationId: org.id } },
      request: {
        validateUsing: () =>
          Promise.resolve({
            advisorNotes: 'Updated notes from test',
          }),
      },
      response: response as any,
      session: session as any,
    } as any)

    assert.deepEqual(session.flashes, [['success', 'Candidat mis à jour.']])
    assert.equal(response.redirectUrl, `/dashboard/employees/${employee.id}`)

    await employee.refresh()
    assert.equal(employee.advisorNotes, 'Updated notes from test')
  })
})
