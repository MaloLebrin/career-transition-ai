import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Notification from '#models/notification'
import NotificationTransformer from '#transformers/notification_transformer'
import { NOTIFICATION_STATUSES, NOTIFICATION_TYPES } from '#shared/constants/notifications'

/** Instance non persistée : le transformer ne touche jamais la base. */
function makeNotification(overrides: Partial<Notification> = {}) {
  const notification = new Notification()
  notification.merge({
    id: 7,
    userId: 1,
    type: NOTIFICATION_TYPES.EXERCISE_COMPLETED,
    status: NOTIFICATION_STATUSES.UNREAD,
    title: 'Exercice terminé',
    body: 'Marie a terminé le DISC',
    meta: { employeeId: 3 },
    readAt: null,
    createdAt: DateTime.fromISO('2026-01-02T03:04:05.000Z', { zone: 'utc' }),
    ...overrides,
  })
  return notification
}

test.group('NotificationTransformer', () => {
  test('sérialise une notification non lue avec des dates ISO', ({ assert }) => {
    const output = new NotificationTransformer(makeNotification()).toObject()

    assert.deepEqual(output, {
      id: 7,
      type: NOTIFICATION_TYPES.EXERCISE_COMPLETED,
      status: NOTIFICATION_STATUSES.UNREAD,
      title: 'Exercice terminé',
      body: 'Marie a terminé le DISC',
      meta: { employeeId: 3 },
      readAt: null,
      createdAt: '2026-01-02T03:04:05.000Z',
    })
  })

  test('expose readAt en ISO pour une notification lue', ({ assert }) => {
    const output = new NotificationTransformer(
      makeNotification({
        status: NOTIFICATION_STATUSES.READ,
        readAt: DateTime.fromISO('2026-01-03T00:00:00.000Z', { zone: 'utc' }),
      })
    ).toObject()

    assert.equal(output.status, NOTIFICATION_STATUSES.READ)
    assert.equal(output.readAt, '2026-01-03T00:00:00.000Z')
  })

  test("n'expose pas l'identifiant du destinataire", ({ assert }) => {
    const output = new NotificationTransformer(makeNotification()).toObject()
    assert.notProperty(output, 'userId')
  })
})
