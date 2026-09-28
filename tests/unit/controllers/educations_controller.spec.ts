import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { errors as lucidErrors } from '@adonisjs/lucid'
import EducationsController from '#controllers/educations_controller'
import { createEducationValidator } from '#validators/education/create_education_validator'
import { updateEducationValidator } from '#validators/education/update_education_validator'
import { idEntityValidator } from '#validators/id_entity_validator'

/**
 * Unit — `EducationsController` : services factices injectés par le constructeur,
 * contexte HTTP réduit aux propriétés consommées. Aucune requête en base.
 */

const EMPLOYEE = { id: 7, organizationId: 3 }
const USER = { id: 11, organizationId: 3 }

class FakeEmployeesService {
  public calls: unknown[] = []
  public error: Error | null = null

  async getEmployeeForUser(user: unknown) {
    this.calls.push(user)
    if (this.error) throw this.error
    return EMPLOYEE
  }
}

class FakeEducationService {
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
  const educationService = new FakeEducationService()
  const employeesService = new FakeEmployeesService()
  const controller = new EducationsController(educationService as any, employeesService as any)
  return { educationService, employeesService, controller }
}

const startDate = DateTime.fromISO('2015-09-01')
const endDate = DateTime.fromISO('2018-06-30')

test.group('EducationsController.store', () => {
  test('crée la formation du candidat connecté avec les valeurs par défaut', async ({ assert }) => {
    const { educationService, employeesService, controller } = setup()
    const request = makeRequest({ degree: 'Master', school: 'IAE', startDate, endDate })
    const response = makeResponse()

    await controller.store({ auth: { user: USER }, request, response } as any)

    assert.deepEqual(request.validators, [createEducationValidator])
    assert.deepEqual(employeesService.calls, [USER])
    assert.deepEqual(educationService.createCalls, [
      {
        degree: 'Master',
        school: 'IAE',
        startDate,
        endDate,
        description: null,
        isCurrent: false,
        employeeId: EMPLOYEE.id,
      },
    ])
    assert.equal(response.redirectUrl, '/dashboard/candidat/profile')
  })

  test('conserve description et isCurrent fournis', async ({ assert }) => {
    const { educationService, controller } = setup()
    const request = makeRequest({
      degree: 'BTS',
      school: 'Lycée',
      startDate,
      endDate: null,
      description: 'Alternance',
      isCurrent: true,
    })

    await controller.store({ auth: { user: USER }, request, response: makeResponse() } as any)

    assert.equal(educationService.createCalls[0].description, 'Alternance')
    assert.isTrue(educationService.createCalls[0].isCurrent)
  })

  test("propage l'erreur si le profil candidat est introuvable", async ({ assert }) => {
    const { educationService, employeesService, controller } = setup()
    employeesService.error = new Error('Profil candidat introuvable.')
    const response = makeResponse()

    await assert.rejects(
      () =>
        controller.store({
          auth: { user: USER },
          request: makeRequest({ degree: 'X', school: 'Y', startDate, endDate: null }),
          response,
        } as any),
      'Profil candidat introuvable.'
    )

    assert.lengthOf(educationService.createCalls, 0)
    assert.isNull(response.redirectUrl)
  })
})

test.group('EducationsController.update', () => {
  test("sépare l'id des champs et restreint la mise à jour au candidat", async ({ assert }) => {
    const { educationService, controller } = setup()
    const request = makeRequest({
      id: 42,
      degree: 'Licence',
      school: 'Université',
      startDate,
      endDate,
      description: '',
    })
    const response = makeResponse()

    await controller.update({ auth: { user: USER }, request, response } as any)

    assert.deepEqual(request.validators, [updateEducationValidator])
    assert.deepEqual(educationService.updateCalls, [
      {
        employeeId: EMPLOYEE.id,
        id: 42,
        data: {
          degree: 'Licence',
          school: 'Université',
          startDate,
          endDate,
          description: null,
          isCurrent: false,
        },
      },
    ])
    assert.equal(response.redirectUrl, '/dashboard/candidat/profile')
  })

  test("propage l'erreur 404 du service (formation d'un autre candidat)", async ({ assert }) => {
    const { educationService, controller } = setup()
    educationService.error = new lucidErrors.E_ROW_NOT_FOUND()
    const response = makeResponse()

    try {
      await controller.update({
        auth: { user: USER },
        request: makeRequest({ id: 999, degree: 'X', school: 'Y', startDate, endDate: null }),
        response,
      } as any)
      assert.fail('update aurait dû lever')
    } catch (error) {
      assert.instanceOf(error, lucidErrors.E_ROW_NOT_FOUND)
    }
    assert.isNull(response.redirectUrl)
  })
})

test.group('EducationsController.delete', () => {
  test('supprime la formation du candidat connecté', async ({ assert }) => {
    const { educationService, controller } = setup()
    const request = makeRequest({ id: 5 })
    const response = makeResponse()

    await controller.delete({ auth: { user: USER }, request, response } as any)

    assert.deepEqual(request.validators, [idEntityValidator])
    assert.deepEqual(educationService.deleteCalls, [{ employeeId: EMPLOYEE.id, id: 5 }])
    assert.equal(response.redirectUrl, '/dashboard/candidat/profile')
  })

  test("propage l'erreur 404 du service sans rediriger", async ({ assert }) => {
    const { educationService, controller } = setup()
    educationService.error = new lucidErrors.E_ROW_NOT_FOUND()
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
