import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import EmployeesController from '#controllers/employees_controller'
import type { EmployeeDto } from '#dtos/employee_dto'
import { EmployeesService } from '#services/employees_service'
import Employee from '#models/employee'
import Organization from '#models/organization'
import User from '#models/user'
import OnboardingToken from '#models/onboarding_token'
import hash from '@adonisjs/core/services/hash'

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
  const headers: Record<string, string> = {}
  let streamCalledWith: any = null
  return {
    redirectUrl,
    headers,
    streamCalledWith,
    unauthorizedCalled: false,
    notFoundCalled: false,
    unauthorized() {
      this.unauthorizedCalled = true
      return this
    },
    notFound() {
      this.notFoundCalled = true
      return this
    },
    header(key: string, value: string) {
      this.headers[key] = value
      return this
    },
    stream(body: any) {
      this.streamCalledWith = body
      return this
    },
    redirect(url: string) {
      this.redirectUrl = url
      return this
    },
    back() {
      this.redirectUrl = '__back__'
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
        protocol: () => 'http',
        hostname: () => 'localhost',
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
    assert.equal(session.flashes.length, 1)
    assert.equal(session.flashes[0][0], 'success')
    assert.include(session.flashes[0][1], 'Candidat ajouté')
    assert.include(session.flashes[0][1], 'email')
    assert.equal(response.redirectUrl, '/dashboard/conseiller/employees')
  })
})

test.group('EmployeesController.resendOnboardingLink', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 401 when user is not authenticated', async ({ assert }) => {
    const controller = new EmployeesController(new EmployeesService() as any)
    const response = makeResponse()

    // @ts-expect-error minimal context
    await controller.resendOnboardingLink({
      params: { id: '1' },
      auth: { user: null },
      request: {} as any,
      response: response as any,
      session: makeSession() as any,
    })

    assert.isTrue(response.unauthorizedCalled)
  })

  test('creates token and redirects back for not-onboarded employee', async ({ assert }) => {
    const org = await Organization.create({
      name: 'Org Resend',
      slug: `org-resend-${Date.now()}`,
      logoUrl: null,
    })

    const advisor = await User.create({
      organizationId: org.id,
      email: `advisor-${Date.now()}@example.com`,
      name: 'Advisor',
      password: await hash.make('secret123'),
      role: 'advisor',
    })

    const employee = await Employee.create({
      organizationId: org.id,
      advisorId: advisor.id,
      userId: null,
      name: 'Candidate',
      email: `candidate-${Date.now()}@example.com`,
      currentRole: 'Dev',
      targetRole: null,
      summary: null,
      advisorNotes: null,
      status: 'active',
      onboarded: false,
    })

    const controller = new EmployeesController(new EmployeesService())
    const response = makeResponse()
    const session = makeSession()

    // @ts-expect-error minimal context
    await controller.resendOnboardingLink({
      params: { id: String(employee.id) },
      auth: { user: advisor },
      request: { protocol: () => 'http', hostname: () => 'localhost' },
      response: response as any,
      session: session as any,
    } as any)

    assert.equal(response.redirectUrl, '__back__')
    // controller uses redirect().back() which our fake doesn't implement; accept no crash + flash.
    assert.deepEqual(session.flashes, [['success', 'Lien d’onboarding renvoyé.']])

    const updated = await Employee.findOrFail(employee.id)
    assert.isNotNull(updated.userId)

    const token = await OnboardingToken.query().where('userId', updated.userId!).orderBy('id', 'desc').first()
    assert.isNotNull(token)
    assert.isNull(token!.usedAt)
  })

  test('rejects resend when employee is already onboarded', async ({ assert }) => {
    const org = await Organization.create({
      name: 'Org Resend2',
      slug: `org-resend2-${Date.now()}`,
      logoUrl: null,
    })

    const advisor = await User.create({
      organizationId: org.id,
      email: `advisor2-${Date.now()}@example.com`,
      name: 'Advisor',
      password: await hash.make('secret123'),
      role: 'advisor',
    })

    const employee = await Employee.create({
      organizationId: org.id,
      advisorId: advisor.id,
      userId: null,
      name: 'Candidate',
      email: `candidate2-${Date.now()}@example.com`,
      currentRole: 'Dev',
      targetRole: null,
      summary: null,
      advisorNotes: null,
      status: 'active',
      onboarded: true,
    })

    const controller = new EmployeesController(new EmployeesService())
    const response = makeResponse()
    const session = makeSession()

    // @ts-expect-error minimal context
    await controller.resendOnboardingLink({
      params: { id: String(employee.id) },
      auth: { user: advisor },
      request: { protocol: () => 'http', hostname: () => 'localhost' },
      response: response as any,
      session: session as any,
    } as any)

    assert.deepEqual(session.flashes, [['error', 'Ce candidat a déjà terminé son onboarding.']])
  })
})

test.group('EmployeesController.showProfileDashboard', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  test('returns 401 when user is not authenticated', async ({ assert }) => {
    const service = new FakeEmployeesService()
    const controller = new EmployeesController(service as any)
    const response = makeResponse()

    await controller.showProfileDashboard({
      params: { id: '1' },
      auth: { user: null },
      response: response as any,
      inertia: () => {},
    } as any)

    assert.isTrue(response.unauthorizedCalled)
  })
})

test.group('EmployeesController.downloadDossier', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  test('returns 401 when user is not authenticated', async ({ assert }) => {
    const service = new FakeEmployeesService()
    const controller = new EmployeesController(service as any)
    const response = makeResponse()

    await controller.downloadDossier({
      params: { id: '1' },
      auth: { user: null },
      response: response as any,
    } as any)

    assert.isTrue(response.unauthorizedCalled)
  })

  test('returns 404 when employee not found or not in user org', async ({ assert }) => {
    const orgA = await Organization.create({
      name: 'Org A Dossier',
      slug: `org-a-dossier-${Date.now()}`,
      logoUrl: null,
    })
    const orgB = await Organization.create({
      name: 'Org B Dossier',
      slug: `org-b-dossier-${Date.now()}`,
      logoUrl: null,
    })
    const employee = await Employee.create({
      organizationId: orgA.id,
      advisorId: null,
      userId: null,
      name: 'Dossier Candidate',
      email: `dossier-${Date.now()}@example.com`,
      currentRole: 'Dev',
      targetRole: null,
      summary: null,
      advisorNotes: null,
      status: 'active',
      onboarded: false,
    })

    const service = new FakeEmployeesService()
    const controller = new EmployeesController(service as any)
    const response = makeResponse()

    await controller.downloadDossier({
      params: { id: String(employee.id) },
      auth: { user: { id: 1, organizationId: orgB.id } },
      response: response as any,
    } as any)

    assert.isTrue(response.notFoundCalled)
  })

  test('sets zip headers and streams archive when authorized', async ({ assert }) => {
    const org = await Organization.create({
      name: 'Org Dossier Export',
      slug: `org-dossier-export-${Date.now()}`,
      logoUrl: null,
    })
    const employee = await Employee.create({
      organizationId: org.id,
      advisorId: null,
      userId: null,
      name: 'Export Candidate',
      email: `export-${Date.now()}@example.com`,
      currentRole: 'Dev',
      targetRole: 'Lead',
      summary: null,
      advisorNotes: null,
      status: 'active',
      onboarded: false,
    })

    const service = new FakeEmployeesService()
    const controller = new EmployeesController(service as any)
    const response = makeResponse()

    await controller.downloadDossier({
      params: { id: String(employee.id) },
      auth: { user: { id: 1, organizationId: org.id } },
      response: response as any,
    } as any)

    assert.equal(response.headers['Content-Type'], 'application/zip')
    assert.include(response.headers['Content-Disposition'], 'attachment')
    assert.include(response.headers['Content-Disposition'], 'Dossier_Export_Candidate.zip')
    assert.isDefined(response.streamCalledWith)
    assert.isFunction(response.streamCalledWith?.pipe)
  })
})

test.group('EmployeesController.updateFromDashboard', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
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
    assert.equal(response.redirectUrl, `/dashboard/conseiller/employees/${employee.id}`)

    await employee.refresh()
    assert.equal(employee.advisorNotes, 'Updated notes from test')
  })
})
