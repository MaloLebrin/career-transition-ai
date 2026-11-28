import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import AuthController from '#controllers/auth_controller'
import { AuthService } from '#services/auth_service'
import { IMPERSONATOR_SESSION_KEY } from '#services/impersonation_service'
import { EmployeesService } from '#services/employees_service'
import { CandidatProfileService } from '#services/candidat_profile_service'
import User from '#models/user'
import Organization from '#models/organization'
import hash from '@adonisjs/core/services/hash'
import Employee from '#models/employee'
import Experience from '#models/experience'
import Education from '#models/education'
import Skill from '#models/skill'
import EmployeeSkill from '#models/employee_skill'
import { DateTime } from 'luxon'

const fakeEmployeesService = { getEmployeeForUser: async () => ({}), applyUpdate: () => {} } as any
const fakeCandidatProfileService = { updateForUser: async () => ({}) } as any

function makeSession(initial: Record<string, unknown> = {}) {
  const flashes: Array<[string, string]> = []
  const store: Record<string, unknown> = { ...initial }
  return {
    flashes,
    store,
    flash(key: string, value: string) {
      this.flashes.push([key, value])
    },
    get(key: string) {
      return store[key]
    },
    put(key: string, value: unknown) {
      store[key] = value
    },
    forget(key: string) {
      delete store[key]
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
    redirect(url?: string) {
      if (url !== undefined) this.redirectUrl = url
      return this
    },
    back() {
      this.redirectUrl = 'back'
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
    const controller = new AuthController(service as any, fakeCandidatProfileService)
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

  test('updates the name and flashes success when the email is unchanged', async ({ assert }) => {
    const user = await createUser('advisor')
    const service = { updateProfile: async () => ({ pendingEmail: null }) }
    const controller = new AuthController(service as any, fakeCandidatProfileService)
    const session = makeSession()
    const response = makeResponse()

    // @ts-expect-error minimal context
    await controller.updateFromDashboard({
      auth: { user },
      request: { validateUsing: () => Promise.resolve({ name: 'New', email: user.email }) },
      response: response as any,
      session: session as any,
    })

    assert.deepEqual(session.flashes, [['success', 'Profil mis à jour.']])
    assert.equal(response.redirectUrl, '/dashboard/conseiller/settings')
  })

  /** #143 : l'adresse ne change qu'après le clic sur le lien envoyé à la nouvelle. */
  test('announces the confirmation link sent to the new address', async ({ assert }) => {
    const user = await createUser('advisor')
    const calls: unknown[] = []
    const service = {
      updateProfile: async (_u: User, input: { email: string }) => {
        calls.push(input)
        return { pendingEmail: input.email }
      },
    }
    const controller = new AuthController(service as any, fakeCandidatProfileService)
    const session = makeSession()
    const response = makeResponse()

    // @ts-expect-error minimal context
    await controller.updateFromDashboard({
      auth: { user },
      request: {
        validateUsing: () => Promise.resolve({ name: 'New', email: 'nouvelle@example.com' }),
      },
      response: response as any,
      session: session as any,
    })

    assert.deepEqual(calls, [{ name: 'New', email: 'nouvelle@example.com' }])
    assert.deepEqual(session.flashes, [
      [
        'success',
        'Profil mis à jour. Un lien de confirmation a été envoyé à nouvelle@example.com : votre adresse changera après votre clic.',
      ],
    ])
    assert.equal(response.redirectUrl, '/dashboard/conseiller/settings')
  })
})

async function createUser(role: 'advisor' | 'super_admin') {
  const org = await Organization.create({ name: 'Org', slug: `org-${Date.now()}-${Math.random()}` })
  return User.create({
    organizationId: org.id,
    email: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@example.com`,
    name: role === 'advisor' ? 'Target' : 'Super Admin',
    password: 'secret123',
    role,
  })
}

/**
 * Accès (401/403) porté par les middlewares de route `auth()` + `superAdmin()`
 * (cf. tests/functional/auth/super_admin_actions.spec.ts) : on ne teste ici que
 * le comportement du contrôleur une fois l'accès accordé.
 */
test.group('AuthController super admin actions', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  function authFor(actor: User, loggedIn: User[]) {
    return {
      getUserOrFail: () => actor,
      use: () => ({
        login: async (user: User) => loggedIn.push(user),
        logout: async () => loggedIn.push(null as any),
      }),
    }
  }

  test('impersonate logs in as the target and keeps the super admin id in session (#143)', async ({
    assert,
  }) => {
    const actor = await createUser('super_admin')
    const target = await createUser('advisor')
    const loggedIn: User[] = []
    const controller = new AuthController(new AuthService(), fakeCandidatProfileService)
    const response = makeResponse()
    const session = makeSession()

    // @ts-expect-error minimal context
    await controller.impersonate({
      auth: authFor(actor, loggedIn),
      params: { id: target.id },
      response: response as any,
      session: session as any,
    })

    assert.deepEqual(
      loggedIn.map((u) => u.id),
      [target.id]
    )
    assert.deepEqual(session.store[IMPERSONATOR_SESSION_KEY], {
      impersonatorId: actor.id,
      targetId: target.id,
    })
    assert.equal(response.redirectUrl, '/dashboard')
    assert.deepEqual(session.flashes, [
      ['success', 'Vous êtes maintenant connecté en tant que Target.'],
    ])
  })

  test('impersonate flashes an error for an unknown user', async ({ assert }) => {
    const actor = await createUser('super_admin')
    const controller = new AuthController(new AuthService(), fakeCandidatProfileService)
    const response = makeResponse()
    const session = makeSession()

    // @ts-expect-error minimal context
    await controller.impersonate({
      auth: { getUserOrFail: () => actor, use: () => assert.fail('ne doit pas ouvrir de session') },
      params: { id: 999999 },
      response: response as any,
      session: session as any,
    })

    assert.equal(response.redirectUrl, '/dashboard/super-admin')
    assert.isUndefined(session.store[IMPERSONATOR_SESSION_KEY])
    assert.deepEqual(session.flashes, [['error', "Utilisateur introuvable pour l'impersonation."]])
  })

  test('leaveImpersonation logs the super admin back in and clears the session key', async ({
    assert,
  }) => {
    const actor = await createUser('super_admin')
    const target = await createUser('advisor')
    const loggedIn: User[] = []
    const controller = new AuthController(new AuthService(), fakeCandidatProfileService)
    const response = makeResponse()
    const session = makeSession({
      [IMPERSONATOR_SESSION_KEY]: { impersonatorId: actor.id, targetId: target.id },
    })

    // @ts-expect-error minimal context
    await controller.leaveImpersonation({
      auth: authFor(target, loggedIn),
      response: response as any,
      session: session as any,
    })

    assert.deepEqual(
      loggedIn.map((u) => u.id),
      [actor.id]
    )
    assert.isUndefined(session.store[IMPERSONATOR_SESSION_KEY])
    assert.equal(response.redirectUrl, '/dashboard/super-admin')
    assert.deepEqual(session.flashes, [['success', 'Vous êtes de retour sur votre compte.']])
  })

  test('leaveImpersonation logs out when the original account is gone', async ({ assert }) => {
    const target = await createUser('advisor')
    const loggedIn: Array<User | null> = []
    const controller = new AuthController(new AuthService(), fakeCandidatProfileService)
    const response = makeResponse()
    const session = makeSession({
      [IMPERSONATOR_SESSION_KEY]: { impersonatorId: 999999, targetId: target.id },
    })

    // @ts-expect-error minimal context
    await controller.leaveImpersonation({
      auth: authFor(target, loggedIn as User[]),
      response: response as any,
      session: session as any,
    })

    assert.deepEqual(loggedIn, [null])
    assert.isUndefined(session.store[IMPERSONATOR_SESSION_KEY])
    assert.equal(response.redirectUrl, '/auth/login')
  })

  test('logout clears an impersonation in progress', async ({ assert }) => {
    const controller = new AuthController(new AuthService(), fakeCandidatProfileService)
    const response = makeResponse()
    const session = makeSession({ [IMPERSONATOR_SESSION_KEY]: 1 })

    // @ts-expect-error minimal context
    await controller.logout({
      auth: { use: () => ({ logout: async () => {} }) },
      response: response as any,
      session: session as any,
    })

    assert.isUndefined(session.store[IMPERSONATOR_SESSION_KEY])
    assert.equal(response.redirectUrl, '/')
  })
})

test.group('AuthController.updateProfileCandidat', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 401 when user is not authenticated', async ({ assert }) => {
    const controller = new AuthController(
      new AuthService() as any,
      new CandidatProfileService(
        new EmployeesService({ sendSetPasswordLink: async () => {} } as any) as any,
        { sendLinkSafely: async () => {} } as any
      ) as any
    )
    const response = makeResponse()
    const session = makeSession()

    // @ts-expect-error minimal context
    await controller.updateProfileCandidat({
      auth: { user: null },
      request: {} as any,
      response: response as any,
      session: session as any,
    })

    assert.isTrue(response.unauthorizedCalled)
  })

  test('syncs experiences/educations/skills when arrays are provided (lenient dates)', async ({
    assert,
  }) => {
    const org = await Organization.create({
      name: 'Candidat Org',
      slug: `candidat-org-${Date.now()}`,
      logoUrl: null,
    })

    const user = await User.create({
      organizationId: org.id,
      email: `candidat-${Date.now()}@example.com`,
      name: 'Candidat',
      password: await hash.make('secret123'),
      role: 'employee',
    })

    const employee = await Employee.create({
      organizationId: org.id,
      advisorId: null,
      userId: user.id,
      name: 'Candidat',
      email: user.email,
      currentRole: 'Dev',
      targetRole: null,
      summary: null,
      advisorNotes: null,
      status: 'onboarding',
      onboarded: false,
    })

    // Seed existing rows to ensure delete+recreate behavior
    await Experience.create({
      employeeId: employee.id,
      title: 'Old XP',
      company: 'Old Co',
      type: 'cdi',
      startDate: DateTime.fromISO('2020-01-01'),
      endDate: null,
      isCurrent: false,
      description: null,
      sortOrder: null,
    })
    await Education.create({
      employeeId: employee.id,
      degree: 'Old Degree',
      school: 'Old School',
      startDate: DateTime.fromISO('2010-01-01'),
      endDate: null,
      isCurrent: false,
      description: null,
      sortOrder: null,
    })

    const employeesService = new EmployeesService({ sendSetPasswordLink: async () => {} } as any)
    const controller = new AuthController(
      new AuthService() as any,
      new CandidatProfileService(employeesService, { sendLinkSafely: async () => {} } as any) as any
    )
    const response = makeResponse()
    const session = makeSession()

    const payload = {
      name: 'Candidat Updated',
      currentRole: 'Senior Dev',
      onboarded: true,
      experiences: [
        // invalid date -> should be ignored
        { title: 'Bad', company: 'BadCo', type: 'CDI', startDate: 'not-a-date' },
        // valid month date -> should be accepted
        {
          title: 'New XP',
          company: 'NewCo',
          type: 'Freelance',
          startDate: '2024-03',
          endDate: '2025-01-01',
          isCurrent: false,
          description: 'Did stuff',
        },
      ],
      educations: [
        {
          degree: 'Master',
          school: 'Uni',
          startDate: '2018-09-01',
          endDate: null,
          isCurrent: true,
          description: '',
        },
      ],
      skills: [
        { name: 'TypeScript', level: 4 },
        { name: '  ', level: 2 }, // ignored
      ],
    }

    // @ts-expect-error minimal context
    await controller.updateProfileCandidat({
      auth: { user },
      request: { validateUsing: () => Promise.resolve(payload) },
      response: response as any,
      session: session as any,
    })

    await employee.refresh()
    assert.isTrue(employee.onboarded)
    assert.equal(employee.status, 'active')
    assert.equal(employee.currentRole, 'Senior Dev')
    assert.equal(employee.name, 'Candidat Updated')

    const experiences = await Experience.query().where('employeeId', employee.id)
    assert.lengthOf(experiences, 1)
    assert.equal(experiences[0].title, 'New XP')
    assert.equal(experiences[0].type, 'freelance')

    const educations = await Education.query().where('employeeId', employee.id)
    assert.lengthOf(educations, 1)
    assert.equal(educations[0].degree, 'Master')

    const skill = await Skill.query()
      .where('organizationId', org.id)
      .where('name', 'TypeScript')
      .first()
    assert.isNotNull(skill)
    const pivot = await EmployeeSkill.query()
      .where('employeeId', employee.id)
      .where('skillId', skill!.id)
      .first()
    assert.isNotNull(pivot)
    assert.equal(pivot!.level, 4)

    // Formulaire d'identité de la page profil (#70) : retour sur la page.
    assert.equal(response.redirectUrl, 'back')
    assert.deepEqual(session.flashes, [['success', 'Profil mis à jour.']])
  })
})
