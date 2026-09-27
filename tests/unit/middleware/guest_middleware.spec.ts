import { test } from '@japa/runner'
import GuestMiddleware from '#middleware/guest_middleware'
import { makeCtx, makeNext } from '#tests/support/http_context'

test.group('GuestMiddleware', () => {
  test('laisse passer un invité en interrogeant la garde par défaut', async ({ assert }) => {
    const { ctx, redirects, checkedGuards } = makeCtx({ authenticated: false, defaultGuard: 'web' })
    const { next, calls } = makeNext()

    await new GuestMiddleware().handle(ctx, next)

    assert.equal(calls.count, 1)
    assert.deepEqual(redirects, [])
    assert.deepEqual(checkedGuards, ['web'])
  })

  test('redirige un utilisateur connecté vers /dashboard en conservant la query string', async ({
    assert,
  }) => {
    const { ctx, redirectCalls } = makeCtx({ authenticated: true })
    const { next, calls } = makeNext()

    await new GuestMiddleware().handle(ctx, next)

    assert.equal(calls.count, 0)
    assert.deepEqual(redirectCalls, [{ target: '/dashboard', forwardQs: true }])
  })

  test('interroge chacune des gardes fournies', async ({ assert }) => {
    const { ctx, checkedGuards } = makeCtx({ authenticated: false })
    const { next, calls } = makeNext()

    await new GuestMiddleware().handle(ctx, next, { guards: ['web', 'api'] as never })

    assert.equal(calls.count, 1)
    assert.deepEqual(checkedGuards, ['web', 'api'])
  })

  test("s'arrête à la première garde authentifiée", async ({ assert }) => {
    const { ctx, checkedGuards, redirects } = makeCtx({ authenticated: true })
    const { next, calls } = makeNext()

    await new GuestMiddleware().handle(ctx, next, { guards: ['web', 'api'] as never })

    assert.equal(calls.count, 0)
    assert.deepEqual(checkedGuards, ['web'])
    assert.deepEqual(redirects, ['/dashboard'])
  })
})
