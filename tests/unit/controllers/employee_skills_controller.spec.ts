import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { errors as lucidErrors } from '@adonisjs/lucid'
import EmployeeSkillsController from '#controllers/employee_skills_controller'
import Skill from '#models/skill'
import type Organization from '#models/organization'
import { OrganizationFactory } from '#database/factories/organization_factory'
import { addEmployeeSkillValidator } from '#validators/employee_skill/add_employee_skill_validator'
import { updateEmployeeSkillValidator } from '#validators/employee_skill/update_employee_skill_validator'

/**
 * Unit — `EmployeeSkillsController` : services factices injectés par le constructeur.
 * `store` résout la compétence via `Skill.firstOrCreate` (dette « contrôleur fin »
 * figée dans `controllers_thin.spec.ts`) : ce groupe touche donc la base, isolée par
 * une transaction globale.
 */

const USER = { id: 31 }

type Level = { employeeId: number; skillId: number; level: number }
type OwnLevel = { employeeId: number; employeeSkillId: number; level: number }

class FakeEmployeesService {
  public calls: unknown[] = []
  public error: Error | null = null
  constructor(private employee: { id: number; organizationId: number }) {}

  async getEmployeeForUser(user: unknown) {
    this.calls.push(user)
    if (this.error) throw this.error
    return this.employee
  }
}

class FakeEmployeeSkillService {
  public levelCalls: Level[] = []
  public ownLevelCalls: OwnLevel[] = []
  public error: Error | null = null

  async updateEmployeeSkillLevel(input: Level) {
    this.levelCalls.push(input)
    if (this.error) throw this.error
    return input
  }

  async updateOwnEmployeeSkillLevel(input: OwnLevel) {
    this.ownLevelCalls.push(input)
    if (this.error) throw this.error
    return input
  }
}

function makeResponse() {
  return {
    redirectUrl: null as string | null,
    redirect(url: string) {
      this.redirectUrl = url
      return this
    },
  }
}

function makeRequest(payload: unknown) {
  const validators: unknown[] = []
  return {
    validators,
    validateUsing(validator: unknown) {
      validators.push(validator)
      return Promise.resolve(payload)
    },
  }
}

function setup(organizationId: number) {
  const employee = { id: 77, organizationId }
  const skillService = new FakeEmployeeSkillService()
  const employeesService = new FakeEmployeesService(employee)
  const controller = new EmployeeSkillsController(skillService as any, employeesService as any)
  return { employee, skillService, employeesService, controller }
}

test.group('EmployeeSkillsController.store', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  let org: Organization
  group.each.setup(async () => {
    org = await OrganizationFactory.create()
  })

  test("crée la compétence dans l'organisation du candidat puis fixe son niveau", async ({
    assert,
  }) => {
    const { employee, skillService, employeesService, controller } = setup(org.id)
    const request = makeRequest({ name: '  TypeScript  ', category: ' Tech ', level: 4 })
    const response = makeResponse()

    await controller.store({ auth: { user: USER }, request, response } as any)

    assert.deepEqual(request.validators, [addEmployeeSkillValidator])
    assert.deepEqual(employeesService.calls, [USER])

    const skills = await Skill.query().where('organizationId', org.id)
    assert.lengthOf(skills, 1)
    assert.equal(skills[0].name, 'TypeScript')
    assert.equal(skills[0].category, 'Tech')

    assert.deepEqual(skillService.levelCalls, [
      { employeeId: employee.id, skillId: skills[0].id, level: 4 },
    ])
    assert.equal(response.redirectUrl, '/dashboard/candidat/profile')
  })

  test("réutilise la compétence existante de l'organisation (pas de doublon)", async ({
    assert,
  }) => {
    const existing = await Skill.create({ organizationId: org.id, name: 'SQL', category: null })
    const { skillService, controller } = setup(org.id)

    await controller.store({
      auth: { user: USER },
      request: makeRequest({ name: 'SQL', level: 2 }),
      response: makeResponse(),
    } as any)

    const skills = await Skill.query().where('organizationId', org.id)
    assert.lengthOf(skills, 1)
    assert.equal(skillService.levelCalls[0].skillId, existing.id)
  })

  test("propage l'erreur si le profil candidat est introuvable", async ({ assert }) => {
    const { skillService, employeesService, controller } = setup(org.id)
    employeesService.error = new Error('Profil candidat introuvable.')
    const response = makeResponse()

    await assert.rejects(
      () =>
        controller.store({
          auth: { user: USER },
          request: makeRequest({ name: 'Go', level: 3 }),
          response,
        } as any),
      'Profil candidat introuvable.'
    )

    assert.lengthOf(await Skill.query().where('organizationId', org.id), 0)
    assert.lengthOf(skillService.levelCalls, 0)
    assert.isNull(response.redirectUrl)
  })
})

test.group('EmployeeSkillsController.update', () => {
  test('met à jour le niveau de la ligne pivot du candidat connecté', async ({ assert }) => {
    const { employee, skillService, controller } = setup(1)
    const request = makeRequest({ id: 55, level: 5 })
    const response = makeResponse()

    await controller.update({ auth: { user: USER }, request, response } as any)

    assert.deepEqual(request.validators, [updateEmployeeSkillValidator])
    assert.deepEqual(skillService.ownLevelCalls, [
      { employeeId: employee.id, employeeSkillId: 55, level: 5 },
    ])
    assert.equal(response.redirectUrl, '/dashboard/candidat/profile')
  })

  test("propage l'erreur 404 du service (ligne d'un autre candidat)", async ({ assert }) => {
    const { skillService, controller } = setup(1)
    skillService.error = new lucidErrors.E_ROW_NOT_FOUND()
    const response = makeResponse()

    try {
      await controller.update({
        auth: { user: USER },
        request: makeRequest({ id: 999, level: 1 }),
        response,
      } as any)
      assert.fail('update aurait dû lever')
    } catch (error) {
      assert.instanceOf(error, lucidErrors.E_ROW_NOT_FOUND)
    }
    assert.isNull(response.redirectUrl)
  })
})
