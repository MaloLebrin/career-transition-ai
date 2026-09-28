import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { EmployeesService } from '#services/employees_service'
import Employee from '#models/employee'
import Organization from '#models/organization'
import User from '#models/user'
import EmployeeAlreadyExistsException from '#exceptions/employee_already_exists_exception'
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
})
