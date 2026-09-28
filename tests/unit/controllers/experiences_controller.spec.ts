import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { errors as lucidErrors } from '@adonisjs/lucid'
import ExperiencesController from '#controllers/experiences_controller'
import { EXPERIENCES_TYPES } from '#shared/constants/experience'
import { experienceCreateValidator } from '#validators/experiences/experience_create_validator'
import { experienceUpdateValidator } from '#validators/experiences/experience_update_validator'
import { idEntityValidator } from '#validators/id_entity_validator'

/**
 * Unit — `ExperiencesController` : services factices injectés par le constructeur,
 * contexte HTTP réduit aux propriétés consommées. Aucune requête en base.
 */

const EMPLOYEE = { id: 9, organizationId: 4 }
const USER = { id: 21, organizationId: 4 }

class FakeEmployeesService {
  public calls: unknown[] = []
  public error: Error | null = null

  async getEmployeeForUser(user: unknown) {
    this.calls.push(user)
    if (this.error) throw this.error
    return EMPLOYEE
  }
}

class FakeExperienceService {
  public createCalls: Array<Record<string, unknown>> = []
  public updateCalls: Array<{ employeeId: number; id: number; data: Record<string, unknown> }> = []
  public deleteCalls: Array<{ employeeId: number; id: number }> = []
  public error: Error | null = null

  async create(data: Record<string, unknown>) {
    this.createCalls.push(data)
    if (this.error) throw this.error
    return data
  }

  async update(employeeId: number, id: number, data: Record<string, unknown>) {
    this.updateCalls.push({ employeeId, id, data })
    if (this.error) throw this.error
    return data
  }

  async delete(employeeId: number, id: number) {
    this.deleteCalls.push({ employeeId, id })
    if (this.error) throw this.error
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

function setup() {
  const experienceService = new FakeExperienceService()
  const employeesService = new FakeEmployeesService()
  const controller = new ExperiencesController(experienceService as any, employeesService as any)
  return { experienceService, employeesService, controller }
}

const startDate = DateTime.fromISO('2019-01-01')
const basePayload = {
  title: 'Développeur',
  company: 'ACME',
  type: EXPERIENCES_TYPES.CDI,
  startDate,
  endDate: null,
  description: null,
}

test.group('ExperiencesController.store', () => {
  test("crée l'expérience du candidat connecté (isCurrent par défaut à false)", async ({
    assert,
  }) => {
    const { experienceService, employeesService, controller } = setup()
    const request = makeRequest({ ...basePayload, isCurrent: null })
    const response = makeResponse()

    await controller.store({ auth: { user: USER }, request, response } as any)

    assert.deepEqual(request.validators, [experienceCreateValidator])
    assert.deepEqual(employeesService.calls, [USER])
    assert.deepEqual(experienceService.createCalls, [
      { ...basePayload, isCurrent: false, employeeId: EMPLOYEE.id },
    ])
    assert.equal(response.redirectUrl, '/dashboard/candidat/profile')
  })

  test('conserve isCurrent à true', async ({ assert }) => {
    const { experienceService, controller } = setup()

    await controller.store({
      auth: { user: USER },
      request: makeRequest({ ...basePayload, isCurrent: true }),
      response: makeResponse(),
    } as any)

    assert.isTrue(experienceService.createCalls[0].isCurrent)
  })

  test("propage l'erreur si le profil candidat est introuvable", async ({ assert }) => {
    const { experienceService, employeesService, controller } = setup()
    employeesService.error = new Error('Profil candidat introuvable.')
    const response = makeResponse()

    await assert.rejects(
      () =>
        controller.store({
          auth: { user: USER },
          request: makeRequest({ ...basePayload, isCurrent: null }),
          response,
        } as any),
      'Profil candidat introuvable.'
    )

    assert.lengthOf(experienceService.createCalls, 0)
    assert.isNull(response.redirectUrl)
  })
})

test.group('ExperiencesController.update', () => {
  test("sépare l'id des champs et restreint la mise à jour au candidat", async ({ assert }) => {
    const { experienceService, controller } = setup()
    const request = makeRequest({ id: 13, ...basePayload, isCurrent: undefined })
    const response = makeResponse()

    await controller.update({ auth: { user: USER }, request, response } as any)

    assert.deepEqual(request.validators, [experienceUpdateValidator])
    assert.deepEqual(experienceService.updateCalls, [
      { employeeId: EMPLOYEE.id, id: 13, data: { ...basePayload, isCurrent: false } },
    ])
    assert.equal(response.redirectUrl, '/dashboard/candidat/profile')
  })

  test("propage l'erreur 404 du service (expérience d'un autre candidat)", async ({ assert }) => {
    const { experienceService, controller } = setup()
    experienceService.error = new lucidErrors.E_ROW_NOT_FOUND()
    const response = makeResponse()

    try {
      await controller.update({
        auth: { user: USER },
        request: makeRequest({ id: 999, ...basePayload, isCurrent: false }),
        response,
      } as any)
      assert.fail('update aurait dû lever')
    } catch (error) {
      assert.instanceOf(error, lucidErrors.E_ROW_NOT_FOUND)
    }
    assert.isNull(response.redirectUrl)
  })
})

test.group('ExperiencesController.delete', () => {
  test("supprime l'expérience du candidat connecté", async ({ assert }) => {
    const { experienceService, controller } = setup()
    const request = makeRequest({ id: 3 })
    const response = makeResponse()

    await controller.delete({ auth: { user: USER }, request, response } as any)

    assert.deepEqual(request.validators, [idEntityValidator])
    assert.deepEqual(experienceService.deleteCalls, [{ employeeId: EMPLOYEE.id, id: 3 }])
    assert.equal(response.redirectUrl, '/dashboard/candidat/profile')
  })

  test("propage l'erreur 404 du service sans rediriger", async ({ assert }) => {
    const { experienceService, controller } = setup()
    experienceService.error = new lucidErrors.E_ROW_NOT_FOUND()
    const response = makeResponse()

    try {
      await controller.delete({
        auth: { user: USER },
        request: makeRequest({ id: 999 }),
        response,
      } as any)
      assert.fail('delete aurait dû lever')
    } catch (error) {
      assert.instanceOf(error, lucidErrors.E_ROW_NOT_FOUND)
    }
    assert.isNull(response.redirectUrl)
  })
})
