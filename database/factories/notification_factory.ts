import Notification from '#models/notification'
import {
  NOTIFICATION_STATUSES,
  notificationStatusValues,
  notificationTypeValues,
} from '#shared/constants/notifications'
import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'

export const NotificationFactory = factory
  .define(Notification, ({ faker }) => {
    const status = faker.helpers.arrayElement(notificationStatusValues)
    return {
      userId: 0, // à surcharger dans les tests
      type: faker.helpers.arrayElement(notificationTypeValues),
      status,
      title: faker.lorem.sentence(),
      body: faker.datatype.boolean() ? faker.lorem.paragraph() : null,
      meta: null,
      readAt: status === NOTIFICATION_STATUSES.READ ? DateTime.now() : null,
    }
  })
  .build()
