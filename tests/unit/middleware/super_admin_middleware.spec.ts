import { test } from '@japa/runner'
import SuperAdminMiddleware from '#middleware/super_admin_middleware'
import { makeCtx, makeNext } from '#tests/support/http_context'
import { USERS_ROLES } from '#shared/types/advisor/roles'

const FORBIDDEN = { message: 'Accès réservé aux super administrateurs.' }

test.group('SuperAdminMiddleware', () => {
  test('laisse passer un super administrateur', async ({ assert }) => {
    const { ctx, forbidden } = makeCtx({ user: { id: 1, role: USERS_ROLES.SUPER_ADMIN } })
    const { next, calls } = makeNext()

    await new SuperAdminMiddleware().handle(ctx, next)

    assert.equal(calls.count, 1)
    assert.deepEqual(forbidden, [])
  })

  test('refuse une requête sans utilisateur', async ({ assert }) => {
    const { ctx, forbidden } = makeCtx()
    const { next, calls } = makeNext()

    await new SuperAdminMiddleware().handle(ctx, next)

    assert.equal(calls.count, 0)
    assert.deepEqual(forbidden, [FORBIDDEN])
  })

  for (const role of [
    USERS_ROLES.ADMIN,
    USERS_ROLES.ADVISOR,
    USERS_ROLES.EXPERT,
    USERS_ROLES.EMPLOYEE,
  ]) {
    test(`refuse le rôle ${role}`, async ({ assert }) => {
      const { ctx, forbidden } = makeCtx({ user: { id: 1, role } })
      const { next, calls } = makeNext()

      await new SuperAdminMiddleware().handle(ctx, next)

      assert.equal(calls.count, 0)
      assert.deepEqual(forbidden, [FORBIDDEN])
    })
  }
})
