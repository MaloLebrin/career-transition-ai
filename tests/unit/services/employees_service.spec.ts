import { test } from '@japa/runner'
import { createB2cCandidate, createInHouseExpert } from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import { EmployeesService } from '#services/employees_service'
import Employee from '#models/employee'
import Organization from '#models/organization'
import User from '#models/user'
import EmployeeAlreadyExistsException from '#exceptions/employee_already_exists_exception'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { EmployeeAlreadyOnboardedError, EmployeeNotFoundError } from '#exceptions/employee_errors'
import { EMPLOYEES_STATUS } from '#shared/constants/employee'
import {
  createAdvisor,
  createCandidate,
  createEmployeeFor,
  createOrganization,
} from '#tests/support/actors'

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
