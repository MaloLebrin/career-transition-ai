import { test } from '@japa/runner'
import RegistrationOpenMiddleware, {
  REGISTRATION_CLOSED_MESSAGE,
} from '#middleware/registration_open_middleware'
import { makeCtx, makeNext } from '#tests/support/http_context'
import config from '@adonisjs/core/services/config'

/**
 * Bascule `registration.enabled` le temps d'un groupe, puis restaure la valeur
 * lue au démarrage (`REGISTRATION_ENABLED`, ouverte par défaut en test).
 */
function withRegistration(
  group: { each: { setup: (fn: () => () => void) => void } },
  enabled: boolean
) {
  group.each.setup(() => {
    const previous = config.get<boolean>('registration.enabled')
    config.set('registration.enabled', enabled)
    return () => config.set('registration.enabled', previous)
  })
}

test.group('RegistrationOpenMiddleware — config', () => {
  test('inscription ouverte par défaut hors production', ({ assert }) => {
    assert.isTrue(config.get('registration.enabled'))
  })
})

test.group('RegistrationOpenMiddleware — inscription ouverte', (group) => {
  withRegistration(group, true)

  for (const method of ['GET', 'POST']) {
    test(`laisse passer ${method}`, async ({ assert }) => {
      const { ctx, redirects, forbidden, flashed } = makeCtx({ method })
      const { next, calls } = makeNext()

      await new RegistrationOpenMiddleware().handle(ctx, next)

      assert.equal(calls.count, 1)
      assert.deepEqual(redirects, [])
      assert.deepEqual(forbidden, [])
      assert.deepEqual(flashed, [])
    })
  }
})

test.group('RegistrationOpenMiddleware — inscription fermée', (group) => {
  withRegistration(group, false)

  test('GET : ne sert pas la page et redirige vers la connexion avec un message', async ({
    assert,
  }) => {
    const { ctx, redirects, forbidden, flashed } = makeCtx({ method: 'GET' })
    const { next, calls } = makeNext()

    await new RegistrationOpenMiddleware().handle(ctx, next)

    assert.equal(calls.count, 0)
    assert.deepEqual(redirects, ['/auth/login'])
    assert.deepEqual(flashed, [{ key: 'error', value: REGISTRATION_CLOSED_MESSAGE }])
    assert.deepEqual(forbidden, [])
  })

  test('POST : refuse la création de compte (403)', async ({ assert }) => {
    const { ctx, redirects, forbidden } = makeCtx({ method: 'POST' })
    const { next, calls } = makeNext()

    await new RegistrationOpenMiddleware().handle(ctx, next)

    assert.equal(calls.count, 0)
    assert.deepEqual(forbidden, [REGISTRATION_CLOSED_MESSAGE])
    assert.deepEqual(redirects, [])
  })
})
