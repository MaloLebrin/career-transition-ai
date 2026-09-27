import { NotificationFactory } from '#database/factories/notification_factory'
import Notification from '#models/notification'
import { NOTIFICATION_STATUSES } from '#shared/constants/notifications'
import { createAdvisor, createCandidate } from '#tests/support/actors'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * Notifications du tableau de bord conseiller :
 * - PATCH /dashboard/notifications/:id/read
 * - PATCH /dashboard/notifications/read-all
 *
 * Endpoints JSON (appelés hors Inertia) : 204 sans corps.
 */
function unread(userId: number) {
  return NotificationFactory.merge({
    userId,
    status: NOTIFICATION_STATUSES.UNREAD,
    readAt: null,
  }).create()
}

test.group('Conseiller — notifications', (group) => {
  group.each.setup(() => truncateDb())

  test('marque une notification comme lue', async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const notification = await unread(advisor.id)
    const untouched = await unread(advisor.id)

    const response = await client
      .patch(`/dashboard/notifications/${notification.id}/read`)
      .loginAs(advisor)

    response.assertStatus(204)
    await notification.refresh()
    assert.equal(notification.status, NOTIFICATION_STATUSES.READ)
    assert.isNotNull(notification.readAt)
    await untouched.refresh()
    assert.equal(untouched.status, NOTIFICATION_STATUSES.UNREAD)
  })

  test("ne touche pas à la notification d'un autre utilisateur", async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const other = await createAdvisor()
    const foreign = await unread(other.id)

    const response = await client
      .patch(`/dashboard/notifications/${foreign.id}/read`)
      .loginAs(advisor)

    // Pas de fuite d'existence : même réponse que pour sa propre notification
    response.assertStatus(204)
    await foreign.refresh()
    assert.equal(foreign.status, NOTIFICATION_STATUSES.UNREAD)
    assert.isNull(foreign.readAt)
  })

  test('marque toutes ses notifications comme lues, et seulement les siennes', async ({
    client,
    assert,
  }) => {
    const advisor = await createAdvisor()
    const other = await createAdvisor()
    await unread(advisor.id)
    await unread(advisor.id)
    const foreign = await unread(other.id)

    const response = await client.patch('/dashboard/notifications/read-all').loginAs(advisor)

    response.assertStatus(204)
    const mine = await Notification.query().where('userId', advisor.id)
    assert.lengthOf(mine, 2)
    assert.isTrue(mine.every((n) => n.status === NOTIFICATION_STATUSES.READ && n.readAt !== null))
    await foreign.refresh()
    assert.equal(foreign.status, NOTIFICATION_STATUSES.UNREAD)
  })

  test('un candidat est refusé par le middleware (403)', async ({ client, assert }) => {
    const { user } = await createCandidate()
    const notification = await unread(user.id)

    const response = await client
      .patch(`/dashboard/notifications/${notification.id}/read`)
      .loginAs(user)
      .redirects(0)

    response.assertStatus(403)
    await notification.refresh()
    assert.equal(notification.status, NOTIFICATION_STATUSES.UNREAD)
  })

  test('sans session, la requête est refusée', async ({ client }) => {
    const response = await client
      .patch('/dashboard/notifications/read-all')
      .header('Accept', 'application/json')
      .redirects(0)

    response.assertStatus(401)
  })
})
