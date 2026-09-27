import { test } from '@japa/runner'
import AdminMiddleware from '#middleware/admin_middleware'
import { makeCtx, makeNext } from '#tests/support/http_context'
import { USERS_ROLES } from '#shared/types/advisor/roles'

const FORBIDDEN = { message: 'Accès réservé aux administrateurs.' }

test.group('AdminMiddleware', () => {
  for (const role of [USERS_ROLES.ADMIN, USERS_ROLES.SUPER_ADMIN]) {
    test(`laisse passer le rôle ${role}`, async ({ assert }) => {
      const { ctx, forbidden } = makeCtx({ user: { id: 1, role } })
      const { next, calls } = makeNext()

      await new AdminMiddleware().handle(ctx, next)

      assert.equal(calls.count, 1)
      assert.deepEqual(forbidden, [])
    })
  }

  for (const role of [USERS_ROLES.ADVISOR, USERS_ROLES.EXPERT, USERS_ROLES.EMPLOYEE]) {
    test(`refuse le rôle ${role}`, async ({ assert }) => {
      const { ctx, forbidden } = makeCtx({ user: { id: 1, role } })
      const { next, calls } = makeNext()

      await new AdminMiddleware().handle(ctx, next)

      assert.equal(calls.count, 0)
      assert.deepEqual(forbidden, [FORBIDDEN])
    })
  }

  test('refuse une requête sans utilisateur', async ({ assert }) => {
    const { ctx, forbidden } = makeCtx()
    const { next, calls } = makeNext()

    await new AdminMiddleware().handle(ctx, next)

    assert.equal(calls.count, 0)
    assert.deepEqual(forbidden, [FORBIDDEN])
  })
})
