import { test } from '@japa/runner'
import AdvisorOrAdminMiddleware from '#middleware/advisor_or_admin_middleware'
import { makeCtx, makeNext } from '#tests/support/http_context'
import { USERS_ROLES } from '#shared/types/advisor/roles'

const FORBIDDEN = { message: 'Accès réservé aux conseillers.' }

/**
 * Le middleware s'appuie sur `isConseillerDashboardRole()` : advisor, admin et
 * expert. Le super admin dispose d'un espace dédié et en est **exclu**.
 */
test.group('AdvisorOrAdminMiddleware', () => {
  for (const role of [USERS_ROLES.ADVISOR, USERS_ROLES.ADMIN, USERS_ROLES.EXPERT]) {
    test(`laisse passer le rôle ${role}`, async ({ assert }) => {
      const { ctx, forbidden } = makeCtx({ user: { id: 1, role } })
      const { next, calls } = makeNext()

      await new AdvisorOrAdminMiddleware().handle(ctx, next)

      assert.equal(calls.count, 1)
      assert.deepEqual(forbidden, [])
    })
  }

  for (const role of [USERS_ROLES.EMPLOYEE, USERS_ROLES.SUPER_ADMIN]) {
    test(`refuse le rôle ${role}`, async ({ assert }) => {
      const { ctx, forbidden } = makeCtx({ user: { id: 1, role } })
      const { next, calls } = makeNext()

      await new AdvisorOrAdminMiddleware().handle(ctx, next)

      assert.equal(calls.count, 0)
      assert.deepEqual(forbidden, [FORBIDDEN])
    })
  }

  test('refuse une requête sans utilisateur', async ({ assert }) => {
    const { ctx, forbidden } = makeCtx()
    const { next, calls } = makeNext()

    await new AdvisorOrAdminMiddleware().handle(ctx, next)

    assert.equal(calls.count, 0)
    assert.deepEqual(forbidden, [FORBIDDEN])
  })
})
