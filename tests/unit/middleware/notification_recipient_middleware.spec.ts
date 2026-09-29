import { test } from '@japa/runner'
import NotificationRecipientMiddleware from '#middleware/notification_recipient_middleware'
import { makeCtx, makeNext } from '#tests/support/http_context'
import { USERS_ROLES } from '#shared/types/advisor/roles'

const FORBIDDEN = { message: 'Accès réservé aux destinataires de notifications.' }

/**
 * Mêmes rôles que la cloche (`receivesNotifications()`) : advisor, admin et
 * super admin. Le super admin y est inclus, contrairement à `advisorOrAdmin()`.
 */
test.group('NotificationRecipientMiddleware', () => {
  for (const role of [USERS_ROLES.ADVISOR, USERS_ROLES.ADMIN, USERS_ROLES.SUPER_ADMIN]) {
    test(`laisse passer le rôle ${role}`, async ({ assert }) => {
      const { ctx, forbidden } = makeCtx({ user: { id: 1, role } })
      const { next, calls } = makeNext()

      await new NotificationRecipientMiddleware().handle(ctx, next)

      assert.equal(calls.count, 1)
      assert.deepEqual(forbidden, [])
    })
  }

  test('refuse une requête sans utilisateur', async ({ assert }) => {
    const { ctx, forbidden } = makeCtx()
    const { next, calls } = makeNext()

    await new NotificationRecipientMiddleware().handle(ctx, next)

    assert.equal(calls.count, 0)
    assert.deepEqual(forbidden, [FORBIDDEN])
  })

  for (const role of [USERS_ROLES.EXPERT, USERS_ROLES.EMPLOYEE]) {
    test(`refuse le rôle ${role}`, async ({ assert }) => {
      const { ctx, forbidden } = makeCtx({ user: { id: 1, role } })
      const { next, calls } = makeNext()

      await new NotificationRecipientMiddleware().handle(ctx, next)

      assert.equal(calls.count, 0)
      assert.deepEqual(forbidden, [FORBIDDEN])
    })
  }
})
