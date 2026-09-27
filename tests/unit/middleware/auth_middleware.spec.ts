import { test } from '@japa/runner'
import AuthMiddleware from '#middleware/auth_middleware'
import { makeCtx, makeNext } from '#tests/support/http_context'

/**
 * La redirection vers `/auth/login` n'est pas écrite ici : `authenticateUsing()`
 * lève `E_UNAUTHORIZED_ACCESS` et le handler d'exceptions traduit le
 * `loginRoute` en 302. Ce spec vérifie ce qui appartient au middleware : les
 * arguments transmis et l'absence d'appel à la suite en cas d'échec.
 */
test.group('AuthMiddleware', () => {
  test("transmet les gardes et la route de connexion à l'authentificateur", async ({ assert }) => {
    const { ctx, authenticateCalls } = makeCtx()
    const { next, calls } = makeNext()

    await new AuthMiddleware().handle(ctx, next, { guards: ['web'] as never })

    assert.equal(calls.count, 1)
    assert.deepEqual(authenticateCalls, [
      { guards: ['web'], options: { loginRoute: '/auth/login' } },
    ])
  })

  test('transmet des gardes indéfinies pour laisser la garde par défaut', async ({ assert }) => {
    const { ctx, authenticateCalls } = makeCtx()
    const { next } = makeNext()

    await new AuthMiddleware().handle(ctx, next)

    assert.deepEqual(authenticateCalls, [
      { guards: undefined, options: { loginRoute: '/auth/login' } },
    ])
  })

  test("n'exécute pas la route quand l'authentification échoue", async ({ assert }) => {
    const { ctx } = makeCtx({ authenticateError: new Error('E_UNAUTHORIZED_ACCESS') })
    const { next, calls } = makeNext()

    await assert.rejects(() => new AuthMiddleware().handle(ctx, next), 'E_UNAUTHORIZED_ACCESS')

    assert.equal(calls.count, 0)
  })
})
