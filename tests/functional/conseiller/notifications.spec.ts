import { NotificationFactory } from '#database/factories/notification_factory'
import Notification from '#models/notification'
import { NOTIFICATION_STATUSES } from '#shared/constants/notifications'
import { createAdvisor, createCandidate, createSuperAdmin, createUser } from '#tests/support/actors'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * Notifications du tableau de bord conseiller :
 * - PATCH /dashboard/notifications/:id/read
 * - PATCH /dashboard/notifications/read-all
 *
 * Appelés par la cloche via `router.patch` (Inertia) : redirection vers la page
 * courante. Rôles : `receivesNotifications()` (advisor, admin, super admin,
 * candidat depuis #70).
 */
const PAGE = '/dashboard/conseiller'

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
      .header('referer', PAGE)
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(303)
    response.assertHeader('location', PAGE)
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
      .header('referer', PAGE)
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    // Pas de fuite d'existence : même réponse que pour sa propre notification
    response.assertStatus(303)
    response.assertHeader('location', PAGE)
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

    const response = await client
      .patch('/dashboard/notifications/read-all')
      .header('referer', PAGE)
      .loginAs(advisor)
      .withInertia()
      .redirects(0)

    response.assertStatus(303)
    response.assertHeader('location', PAGE)
    const mine = await Notification.query().where('userId', advisor.id)
    assert.lengthOf(mine, 2)
    assert.isTrue(mine.every((n) => n.status === NOTIFICATION_STATUSES.READ && n.readAt !== null))
    await foreign.refresh()
    assert.equal(foreign.status, NOTIFICATION_STATUSES.UNREAD)
  })

  test('le super admin marque ses notifications comme lues (même rôles que la cloche)', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const notification = await unread(superAdmin.id)

    const response = await client
      .patch(`/dashboard/notifications/${notification.id}/read`)
      .header('referer', '/dashboard/super-admin')
      .loginAs(superAdmin)
      .withInertia()
      .redirects(0)

    response.assertStatus(303)
    response.assertHeader('location', '/dashboard/super-admin')
    await notification.refresh()
    assert.equal(notification.status, NOTIFICATION_STATUSES.READ)
  })

  test("un expert, qui n'a pas de cloche, est refusé (403)", async ({ client, assert }) => {
    const expert = await createUser(USERS_ROLES.EXPERT)
    const notification = await unread(expert.id)

    const response = await client
      .patch(`/dashboard/notifications/${notification.id}/read`)
      .loginAs(expert)
      .redirects(0)

    response.assertStatus(403)
    await notification.refresh()
    assert.equal(notification.status, NOTIFICATION_STATUSES.UNREAD)
  })

  test('un candidat marque ses propres notifications comme lues (#70)', async ({
    client,
    assert,
  }) => {
    const { user } = await createCandidate()
    const notification = await unread(user.id)

    const response = await client
      .patch(`/dashboard/notifications/${notification.id}/read`)
      .header('referer', '/dashboard/candidat')
      .loginAs(user)
      .withInertia()
      .redirects(0)

    response.assertStatus(303)
    response.assertHeader('location', '/dashboard/candidat')
    await notification.refresh()
    assert.equal(notification.status, NOTIFICATION_STATUSES.READ)
  })

  test('sans session, la requête est refusée', async ({ client }) => {
    const response = await client
      .patch('/dashboard/notifications/read-all')
      .header('Accept', 'application/json')
      .redirects(0)

    response.assertStatus(401)
  })
})
