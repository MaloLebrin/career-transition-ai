import { test } from '@japa/runner'
import SilentAuthMiddleware from '#middleware/silent_auth_middleware'
import { makeCtx, makeNext } from '#tests/support/http_context'

test.group('SilentAuthMiddleware', () => {
  test('vérifie la session puis poursuit pour un invité', async ({ assert }) => {
    const { ctx, authChecks, redirects, unauthorized } = makeCtx({ authenticated: false })
    const { next, calls } = makeNext()

    await new SilentAuthMiddleware().handle(ctx, next)

    assert.equal(authChecks.count, 1)
    assert.equal(calls.count, 1)
    assert.deepEqual(redirects, [])
    assert.deepEqual(unauthorized, [])
  })

  test('vérifie la session puis poursuit pour un utilisateur connecté', async ({ assert }) => {
    const { ctx, authChecks } = makeCtx({ authenticated: true, user: { id: 1 } })
    const { next, calls } = makeNext()

    await new SilentAuthMiddleware().handle(ctx, next)

    assert.equal(authChecks.count, 1)
    assert.equal(calls.count, 1)
  })
})
