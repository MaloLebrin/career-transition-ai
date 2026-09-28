import { test } from '@japa/runner'
import { errors as authErrors } from '@adonisjs/auth'
import { errors as lucidErrors } from '@adonisjs/lucid'
import OrganizationLogosController from '#controllers/organization_logos_controller'
import { CloudinaryNotConfiguredError } from '#exceptions/storage_errors'
import { uploadOrganizationLogoValidator } from '#validators/organization/organization_logo_validator'

/**
 * Unit — `OrganizationLogosController` : `BrandingService` factice injecté par le
 * constructeur. Le logo visé est toujours celui de l'organisation de
 * l'utilisateur connecté ; les erreurs du service remontent sans flash.
 */

const USER = { id: 3, organizationId: 17 }

class FakeBrandingService {
  public uploadCalls: Array<{ organizationId: number; file: unknown }> = []
  public deleteCalls: number[] = []
  public error: Error | null = null

  async uploadLogo(organizationId: number, file: unknown) {
    this.uploadCalls.push({ organizationId, file })
    if (this.error) throw this.error
    return { id: organizationId }
  }

  async deleteLogo(organizationId: number) {
    this.deleteCalls.push(organizationId)
    if (this.error) throw this.error
    return { id: organizationId }
  }
}

function makeSession() {
  const flashes: Array<[string, string]> = []
  return {
    flashes,
    flash(key: string, value: string) {
      flashes.push([key, value])
    },
  }
}

function makeResponse() {
  const state = { redirectedBack: false }
  return {
    state,
    redirect() {
      return {
        back() {
          state.redirectedBack = true
        },
      }
    },
  }
}

function makeContext(options: { user?: unknown; payload?: unknown } = {}) {
  const validators: unknown[] = []
  const session = makeSession()
  const response = makeResponse()
  const ctx = {
    auth: {
      getUserOrFail: () => {
        if (options.user === null)
          throw new authErrors.E_UNAUTHORIZED_ACCESS('Unauthorized', {
            guardDriverName: 'session',
          })
        return options.user ?? USER
      },
    },
    request: {
      validateUsing(validator: unknown) {
        validators.push(validator)
        return Promise.resolve(options.payload ?? {})
      },
    },
    response,
    session,
  } as any
  return { ctx, session, response, validators }
}

const logoFile = { clientName: 'logo.png', tmpPath: '/tmp/logo.png' }

test.group('OrganizationLogosController.store', () => {
  test("téléverse le logo de l'organisation de l'utilisateur puis redirige", async ({ assert }) => {
    const service = new FakeBrandingService()
    const controller = new OrganizationLogosController(service as any)
    const { ctx, session, response, validators } = makeContext({ payload: { logo: logoFile } })

    await controller.store(ctx)

    assert.deepEqual(validators, [uploadOrganizationLogoValidator])
    assert.deepEqual(service.uploadCalls, [{ organizationId: USER.organizationId, file: logoFile }])
    assert.deepEqual(session.flashes, [['success', 'Logo mis à jour.']])
    assert.isTrue(response.state.redirectedBack)
  })

  test('propage une erreur de stockage sans flash de succès', async ({ assert }) => {
    const service = new FakeBrandingService()
    service.error = new CloudinaryNotConfiguredError()
    const controller = new OrganizationLogosController(service as any)
    const { ctx, session, response } = makeContext({ payload: { logo: logoFile } })

    try {
      await controller.store(ctx)
      assert.fail('store aurait dû lever')
    } catch (error) {
      assert.instanceOf(error, CloudinaryNotConfiguredError)
    }
    assert.lengthOf(session.flashes, 0)
    assert.isFalse(response.state.redirectedBack)
  })

  test('refuse un utilisateur non authentifié avant toute validation', async ({ assert }) => {
    const service = new FakeBrandingService()
    const controller = new OrganizationLogosController(service as any)
    const { ctx, validators } = makeContext({ user: null, payload: { logo: logoFile } })

    try {
      await controller.store(ctx)
      assert.fail('store aurait dû lever')
    } catch (error) {
      assert.instanceOf(error, authErrors.E_UNAUTHORIZED_ACCESS)
    }
    assert.lengthOf(validators, 0)
    assert.lengthOf(service.uploadCalls, 0)
  })
})

test.group('OrganizationLogosController.destroy', () => {
  test("supprime le logo de l'organisation de l'utilisateur puis redirige", async ({ assert }) => {
    const service = new FakeBrandingService()
    const controller = new OrganizationLogosController(service as any)
    const { ctx, session, response } = makeContext()

    await controller.destroy(ctx)

    assert.deepEqual(service.deleteCalls, [USER.organizationId])
    assert.deepEqual(session.flashes, [['success', 'Logo supprimé.']])
    assert.isTrue(response.state.redirectedBack)
  })

  test('propage le 404 si l’organisation est introuvable', async ({ assert }) => {
    const service = new FakeBrandingService()
    service.error = new lucidErrors.E_ROW_NOT_FOUND()
    const controller = new OrganizationLogosController(service as any)
    const { ctx, session, response } = makeContext()

    try {
      await controller.destroy(ctx)
      assert.fail('destroy aurait dû lever')
    } catch (error) {
      assert.instanceOf(error, lucidErrors.E_ROW_NOT_FOUND)
    }
    assert.lengthOf(session.flashes, 0)
    assert.isFalse(response.state.redirectedBack)
  })
})
