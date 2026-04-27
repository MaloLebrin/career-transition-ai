import Notification from '#models/notification'
import Organization from '#models/organization'
import User from '#models/user'
import { NotificationService } from '#services/notification_service'
import { NOTIFICATION_STATUSES, NOTIFICATION_TYPES } from '#shared/constants/notifications'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

async function seedAdvisor(prefix: string) {
  const ts = Date.now()
  const org = await Organization.create({
    name: `${prefix} Org`,
    slug: `${prefix}-${ts}`,
    logoUrl: null,
  })
  const user = await User.create({
    organizationId: org.id,
    email: `${prefix}-${ts}@example.com`,
    password: await hash.make('secret'),
    name: 'Advisor Test',
    role: USERS_ROLES.ADVISOR as any,
  })
  return { org, user }
}

test.group('NotificationService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('markAsRead met à jour le status et readAt pour le bon utilisateur', async ({ assert }) => {
    const { user } = await seedAdvisor('mark-read')
    const notif = await Notification.create({
      userId: user.id,
      type: NOTIFICATION_TYPES.EXERCISE_COMPLETED,
      status: NOTIFICATION_STATUSES.UNREAD,
      title: 'Test',
      body: null,
      meta: null,
      readAt: null,
    })

    const service = new NotificationService()
    await service.markAsRead(notif.id, user.id)

    const updated = await Notification.findOrFail(notif.id)
    assert.equal(updated.status, NOTIFICATION_STATUSES.READ)
    assert.isNotNull(updated.readAt)
  })

  test("markAsRead ignore les notifications d'un autre utilisateur", async ({ assert }) => {
    const { user: user1 } = await seedAdvisor('mark-read-a')
    const { user: user2 } = await seedAdvisor('mark-read-b')

    const notif = await Notification.create({
      userId: user1.id,
      type: NOTIFICATION_TYPES.EXERCISE_COMPLETED,
      status: NOTIFICATION_STATUSES.UNREAD,
      title: 'Test',
      body: null,
      meta: null,
      readAt: null,
    })

    const service = new NotificationService()
    await service.markAsRead(notif.id, user2.id)

    const unchanged = await Notification.findOrFail(notif.id)
    assert.equal(unchanged.status, NOTIFICATION_STATUSES.UNREAD)
  })

  test('markAllAsRead met à jour uniquement les non-lues du bon utilisateur', async ({
    assert,
  }) => {
    const { user: user1 } = await seedAdvisor('mark-all-a')
    const { user: user2 } = await seedAdvisor('mark-all-b')

    await Notification.createMany([
      {
        userId: user1.id,
        type: NOTIFICATION_TYPES.PDF_EXPORT_COMPLETED,
        status: NOTIFICATION_STATUSES.UNREAD,
        title: 'N1',
        body: null,
        meta: null,
        readAt: null,
      },
      {
        userId: user1.id,
        type: NOTIFICATION_TYPES.AI_SYNTHESIS_READY,
        status: NOTIFICATION_STATUSES.UNREAD,
        title: 'N2',
        body: null,
        meta: null,
        readAt: null,
      },
      {
        userId: user2.id,
        type: NOTIFICATION_TYPES.EXERCISE_COMPLETED,
        status: NOTIFICATION_STATUSES.UNREAD,
        title: 'N3',
        body: null,
        meta: null,
        readAt: null,
      },
    ])

    const service = new NotificationService()
    await service.markAllAsRead(user1.id)

    const user1Notifs = await Notification.query().where('userId', user1.id)
    const user2Notifs = await Notification.query().where('userId', user2.id)

    assert.isTrue(user1Notifs.every((n) => n.status === NOTIFICATION_STATUSES.READ))
    assert.equal(user2Notifs[0].status, NOTIFICATION_STATUSES.UNREAD)
  })

  test("getRecentForUser retourne les notifications dans l'ordre décroissant", async ({
    assert,
  }) => {
    const { user } = await seedAdvisor('recent')
    const now = DateTime.now()
    const earlier = now.minus({ seconds: 5 })
    await Notification.create({
      userId: user.id,
      type: NOTIFICATION_TYPES.PDF_EXPORT_COMPLETED,
      status: NOTIFICATION_STATUSES.UNREAD,
      title: 'Première',
      body: null,
      meta: null,
      readAt: null,
      createdAt: earlier,
      updatedAt: earlier,
    })
    await Notification.create({
      userId: user.id,
      type: NOTIFICATION_TYPES.EXERCISE_COMPLETED,
      status: NOTIFICATION_STATUSES.UNREAD,
      title: 'Deuxième',
      body: null,
      meta: null,
      readAt: null,
      createdAt: now,
      updatedAt: now,
    })

    const service = new NotificationService()
    const results = await service.getRecentForUser(user.id, 20)

    assert.equal(results.length, 2)
    assert.equal(results[0].title, 'Deuxième')
    assert.equal(results[1].title, 'Première')
  })

  test('getRecentForUser respecte la limite', async ({ assert }) => {
    const { user } = await seedAdvisor('limit')
    await Notification.createMany(
      Array.from({ length: 5 }, (_, i) => ({
        userId: user.id,
        type: NOTIFICATION_TYPES.PDF_EXPORT_COMPLETED,
        status: NOTIFICATION_STATUSES.UNREAD,
        title: `Notif ${i}`,
        body: null,
        meta: null,
        readAt: null,
      }))
    )

    const service = new NotificationService()
    const results = await service.getRecentForUser(user.id, 3)

    assert.equal(results.length, 3)
  })

  test('getUnreadCountForUser compte uniquement les non-lues', async ({ assert }) => {
    const { user } = await seedAdvisor('count')
    await Notification.createMany([
      {
        userId: user.id,
        type: NOTIFICATION_TYPES.PDF_EXPORT_COMPLETED,
        status: NOTIFICATION_STATUSES.UNREAD,
        title: 'U1',
        body: null,
        meta: null,
        readAt: null,
      },
      {
        userId: user.id,
        type: NOTIFICATION_TYPES.EXERCISE_COMPLETED,
        status: NOTIFICATION_STATUSES.UNREAD,
        title: 'U2',
        body: null,
        meta: null,
        readAt: null,
      },
      {
        userId: user.id,
        type: NOTIFICATION_TYPES.AI_SYNTHESIS_READY,
        status: NOTIFICATION_STATUSES.READ,
        title: 'R1',
        body: null,
        meta: null,
        readAt: null,
      },
    ])

    const service = new NotificationService()
    const count = await service.getUnreadCountForUser(user.id)

    assert.equal(count, 2)
  })
})
