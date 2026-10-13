import { test } from '@japa/runner'
import { EmployeeFactory } from '#database/factories/employee_factory'
import { LIST_PAGE_SIZE } from '#shared/constants/pagination'
import {
  createAdmin,
  createAdvisor,
  createB2cCandidate,
  createCandidate,
  createEmployeeFor,
  createInHouseExpert,
  createOrganization,
  createPlatformOrganization,
} from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import { EmployeesService } from '#services/employees_service'
import Employee from '#models/employee'
import Organization from '#models/organization'
import User from '#models/user'
import EmployeeAlreadyExistsException from '#exceptions/employee_already_exists_exception'
import { EmployeeAlreadyOnboardedError, EmployeeNotFoundError } from '#exceptions/employee_errors'
import { CandidateLicenseLimitReachedError } from '#exceptions/team_errors'
import { EMPLOYEES_STATUS } from '#shared/constants/employee'
import { MAX_LICENSES_CANDIDATES } from '#shared/constants/organisation'
import { USERS_ROLES } from '#shared/types/advisor/roles'

test.group('EmployeesService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  test('create creates an employee and returns EmployeeDto', async ({ assert }) => {
    const service = new EmployeesService({ sendSetPasswordLink: async () => {} } as any)
    const org = await Organization.create({
      name: 'Employees Org',
      slug: `employees-org-${Date.now()}`,
      logoUrl: null,
    })

    const dto = await service.create({
      organizationId: org.id,
      advisorId: null,
      name: 'New Candidate',
      email: 'new@example.com',
      currentRole: 'Développeur',
      targetRole: 'Lead Dev',
      summary: 'Résumé',
    })

    assert.equal(dto.name, 'New Candidate')
    assert.equal(dto.email, 'new@example.com')
    assert.equal(dto.organizationId, String(org.id))
    assert.equal(dto.currentRole, 'Développeur')
    assert.equal(dto.targetRole, 'Lead Dev')
    // status may rely on DB default; just ensure it's one of expected values when set
    if (dto.status) {
      assert.include(['active', 'completed', 'on-hold'], dto.status)
    }
    assert.isFalse(dto.onboarded)
  })

  test('applyUpdate merges fields correctly', async ({ assert }) => {
    const service = new EmployeesService({ sendSetPasswordLink: async () => {} } as any)
    const org = await Organization.create({
      name: 'ApplyUpdate Org',
      slug: `apply-update-org-${Date.now()}`,
      logoUrl: null,
    })

    const employee = await Employee.create({
      organizationId: org.id,
      advisorId: null,
      userId: null,
      name: 'Jane Doe',
      email: 'jane@example.com',
      currentRole: 'Dev',
      targetRole: 'Lead',
      summary: 'Old summary',
      advisorNotes: 'Old notes',
      status: 'active',
      onboarded: false,
    })

    service.applyUpdate(employee, {
      advisorNotes: 'New notes',
      targetRole: 'Manager',
      summary: 'New summary',
      currentRole: 'Senior Dev',
      onboarded: true,
    })

    assert.equal(employee.advisorNotes, 'New notes')
    assert.equal(employee.targetRole, 'Manager')
    assert.equal(employee.summary, 'New summary')
    assert.equal(employee.currentRole, 'Senior Dev')
    assert.isTrue(employee.onboarded)
  })
})

test.group('EmployeesService — doublons à la création', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  for (const onboarded of [true, false]) {
    test(`refuse un candidat déjà présent (onboarded=${onboarded}) sans envoyer d’email`, async ({
      assert,
    }) => {
      const sent: string[] = []
      const service = new EmployeesService({
        sendSetPasswordLink: async ({ user }: { user: User }) => {
          sent.push(user.email)
        },
      } as any)
      const org = await Organization.create({
        name: 'Duplicates Org',
        slug: `duplicates-org-${Date.now()}`,
        logoUrl: null,
      })
      const user = await User.create({
        organizationId: org.id,
        email: 'dup@example.com',
        name: 'Dup',
        password: 'secret-password',
        role: USERS_ROLES.EMPLOYEE,
      })
      await Employee.create({
        organizationId: org.id,
        userId: user.id,
        name: 'Dup',
        email: 'dup@example.com',
        currentRole: 'Comptable',
        onboarded,
      })

      await assert.rejects(
        () =>
          service.create(
            { organizationId: org.id, name: 'Dup bis', email: 'dup@example.com' },
            { sendInvite: true }
          ),
        EmployeeAlreadyExistsException
      )
      assert.deepEqual(sent, [])
      const count = await Employee.query().where('organizationId', org.id).count('* as total')
      assert.equal(Number(count[0].$extras.total), 1)
    })
  }
})

test.group('EmployeesService.findEmployeeForUser', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('renvoie null pour un utilisateur sans fiche candidat', async ({ assert }) => {
    const service = new EmployeesService({ sendSetPasswordLink: async () => {} } as any)
    const org = await Organization.create({
      name: 'Advisor Org',
      slug: `advisor-org-${Date.now()}`,
      logoUrl: null,
    })
    const advisor = await User.create({
      organizationId: org.id,
      email: 'advisor@example.com',
      name: 'Advisor',
      password: 'secret-password',
      role: USERS_ROLES.ADVISOR,
    })

    assert.isNull(await service.findEmployeeForUser(advisor))
  })

  test('withAdvisor précharge le conseiller (nom seul) — accueil B2C #100', async ({ assert }) => {
    const service = new EmployeesService({ sendSetPasswordLink: async () => {} } as any)
    const expert = await createInHouseExpert()
    const { user } = await createB2cCandidate({ expert })

    const plain = await service.findEmployeeForUser(user)
    assert.isUndefined(plain?.advisor)

    const withAdvisor = await service.findEmployeeForUser(user, { withAdvisor: true })
    assert.equal(withAdvisor?.advisor?.name, expert.name)
    assert.isUndefined(withAdvisor?.advisor?.email)
  })
})

test.group('EmployeesService.listForTeam (#75)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const service = new EmployeesService({} as any)
  const params = { page: 1, search: '', status: null }

  test('un conseiller ne voit que ses candidats, triés par nom, avec la méta de page', async ({
    assert,
  }) => {
    const advisor = await createAdvisor()
    const other = await createAdvisor(await advisor.related('organization').query().firstOrFail())
    await EmployeeFactory.merge({
      organizationId: advisor.organizationId,
      advisorId: advisor.id,
      name: 'Zoé',
    }).create()
    await EmployeeFactory.merge({
      organizationId: advisor.organizationId,
      advisorId: advisor.id,
      name: 'Alice',
    }).create()
    await EmployeeFactory.merge({
      organizationId: advisor.organizationId,
      advisorId: other.id,
      name: 'Autre',
    }).create()

    const { items, pagination } = await service.listForTeam(advisor, params)

    assert.deepEqual(
      items.map((e) => e.name),
      ['Alice', 'Zoé']
    )
    assert.deepEqual(pagination, { page: 1, pageSize: LIST_PAGE_SIZE, total: 2, lastPage: 1 })
  })

  test('pagine : la deuxième page contient le reste', async ({ assert }) => {
    const admin = await createAdmin()
    for (let i = 0; i < LIST_PAGE_SIZE + 2; i++) {
      await EmployeeFactory.merge({
        organizationId: admin.organizationId,
        name: `Candidat ${String(i).padStart(3, '0')}`,
      }).create()
    }

    const first = await service.listForTeam(admin, params)
    const second = await service.listForTeam(admin, { ...params, page: 2 })

    assert.lengthOf(first.items, LIST_PAGE_SIZE)
    assert.lengthOf(second.items, 2)
    assert.equal(second.pagination.lastPage, 2)
    assert.equal(second.pagination.total, LIST_PAGE_SIZE + 2)
  })

  test('recherche par nom ou e-mail (insensible à la casse) et filtre de statut', async ({
    assert,
  }) => {
    const admin = await createAdmin()
    const make = (name: string, email: string, status: string) =>
      EmployeeFactory.merge({
        organizationId: admin.organizationId,
        name,
        email,
        status,
      }).create()
    await make('Jean Dupont', 'jean@exemple.fr', 'active')
    await make('Marie Bernard', 'marie@exemple.fr', 'completed')
    await make('Paul Jeanne', 'paul@exemple.fr', 'completed')

    const byName = await service.listForTeam(admin, { ...params, search: 'JEAN' })
    const byEmail = await service.listForTeam(admin, { ...params, search: 'marie@' })
    const byStatus = await service.listForTeam(admin, { ...params, status: 'completed' })
    const both = await service.listForTeam(admin, {
      ...params,
      search: 'jean',
      status: 'completed',
    })

    assert.sameMembers(
      byName.items.map((e) => e.name),
      ['Jean Dupont', 'Paul Jeanne']
    )
    assert.deepEqual(
      byEmail.items.map((e) => e.name),
      ['Marie Bernard']
    )
    assert.sameMembers(
      byStatus.items.map((e) => e.name),
      ['Marie Bernard', 'Paul Jeanne']
    )
    assert.deepEqual(
      both.items.map((e) => e.name),
      ['Paul Jeanne']
    )
  })

  test('les caractères % et _ de la recherche sont littéraux', async ({ assert }) => {
    const admin = await createAdmin()
    await EmployeeFactory.merge({ organizationId: admin.organizationId, name: 'Jean' }).create()

    const { items } = await service.listForTeam(admin, { ...params, search: '%' })

    assert.lengthOf(items, 0)
  })

  test("n'expose jamais les candidats d'une autre organisation", async ({ assert }) => {
    const admin = await createAdmin()
    const stranger = await createAdmin()
    await EmployeeFactory.merge({
      organizationId: stranger.organizationId,
      name: 'Étranger',
    }).create()

    const { items, pagination } = await service.listForTeam(admin, params)

    assert.lengthOf(items, 0)
    assert.equal(pagination.total, 0)
  })

  test('une page au-delà de la dernière est vide', async ({ assert }) => {
    const admin = await createAdmin()
    await EmployeeFactory.merge({ organizationId: admin.organizationId }).create()

    const { items } = await service.listForTeam(admin, { ...params, page: 9 })

    assert.lengthOf(items, 0)
  })
})

test.group('EmployeesService — licences candidat (#71)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const service = new EmployeesService({ sendSetPasswordLink: async () => {} } as any)

  test('refuse la création au-delà de MAX_LICENSES_CANDIDATES, fiches archivées exclues', async ({
    assert,
  }) => {
    const org = await createOrganization()
    await EmployeeFactory.merge({ organizationId: org.id }).createMany(MAX_LICENSES_CANDIDATES)
    const input = {
      organizationId: org.id,
      advisorId: null,
      name: 'Trop',
      email: 'trop@example.com',
      currentRole: 'Dev',
    }

    await assert.rejects(() => service.create(input), CandidateLicenseLimitReachedError)
    assert.isNull(await Employee.findBy('email', 'trop@example.com'))

    const one = await Employee.query().where('organizationId', org.id).firstOrFail()
    await one.merge({ status: EMPLOYEES_STATUS.ARCHIVED }).save()
    const dto = await service.create(input)
    assert.equal(dto.email, 'trop@example.com')
  })

  test('l’organisation plateforme n’est pas limitée', async ({ assert }) => {
    const platform = await createPlatformOrganization()
    await EmployeeFactory.merge({ organizationId: platform.id }).createMany(MAX_LICENSES_CANDIDATES)

    await service.assertCandidateSeatAvailable(platform.id)
    assert.isTrue(true)
  })
})

test.group('EmployeesService — actions du conseiller (#72)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const service = new EmployeesService({ sendSetPasswordLink: async () => {} } as any)

  test('findForTeam : candidat de l’équipe, sinon 404', async ({ assert }) => {
    const advisor = await createAdvisor()
    const mine = await createEmployeeFor(advisor)
    const { employee: foreign } = await createCandidate({
      organization: await createOrganization(),
    })

    const found = await service.findForTeam(advisor, mine.id)
    assert.equal(found.id, mine.id)
    await assert.rejects(() => service.findForTeam(advisor, foreign.id), EmployeeNotFoundError)
    await assert.rejects(() => service.findForTeam(advisor, 999999), EmployeeNotFoundError)
  })

  test('archive / restore : statut archivé, puis actif ou onboarding selon l’activation', async ({
    assert,
  }) => {
    const advisor = await createAdvisor()
    const active = await createEmployeeFor(advisor)
    await active.merge({ onboarded: true }).save()
    const pending = await createEmployeeFor(advisor)
    await pending.merge({ onboarded: false }).save()

    await service.archive(active)
    await service.archive(pending)
    await active.refresh()
    assert.equal(active.status, EMPLOYEES_STATUS.ARCHIVED)

    await service.restore(active)
    await service.restore(pending)
    await active.refresh()
    await pending.refresh()
    assert.equal(active.status, EMPLOYEES_STATUS.ACTIVE)
    assert.equal(pending.status, EMPLOYEES_STATUS.ONBOARDING)
  })

  test('resendOnboardingLink : refuse un candidat déjà onboardé (erreur de domaine 409)', async ({
    assert,
  }) => {
    const advisor = await createAdvisor()
    const employee = await createEmployeeFor(advisor)
    await employee.merge({ onboarded: true }).save()

    await assert.rejects(
      () => service.resendOnboardingLink(employee),
      EmployeeAlreadyOnboardedError
    )
  })
})
