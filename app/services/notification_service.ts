import Notification from '#models/notification'
import {
  NOTIFICATION_STATUSES,
  type NotificationStatus,
  type NotificationType,
} from '#shared/constants/notifications'
import { inject } from '@adonisjs/core'
import transmit from '@adonisjs/transmit/services/main'
import { DateTime } from 'luxon'

type NotifyInput = {
  userId: number
  type: NotificationType
  title: string
  body?: string
  meta?: Record<string, unknown>
}

export type SerializedNotification = {
  id: number
  type: NotificationType
  status: NotificationStatus
  title: string
  body: string | null
  meta: Record<string, unknown> | null
  readAt: string | null
  createdAt: string
}

function serialize(n: Notification): SerializedNotification {
  return {
    id: n.id,
    type: n.type,
    status: n.status,
    title: n.title,
    body: n.body,
    meta: n.meta,
    readAt: n.readAt?.toISO() ?? null,
    createdAt: n.createdAt.toISO()!,
  }
}

@inject()
export class NotificationService {
  async notify(input: NotifyInput): Promise<Notification> {
    const notification = await Notification.create({
      userId: input.userId,
      type: input.type,
      status: NOTIFICATION_STATUSES.UNREAD,
      title: input.title,
      body: input.body ?? null,
      meta: input.meta ?? null,
    })

    transmit.broadcast(`users/${input.userId}/notifications`, serialize(notification) as any)

    const { default: SendNotificationEmailJob } = await import('#jobs/send_notification_email_job')
    await SendNotificationEmailJob.dispatch({ notificationId: notification.id }).toQueue('default')

    return notification
  }

  async markAsRead(notificationId: number, userId: number): Promise<void> {
    await Notification.query()
      .where('id', notificationId)
      .where('userId', userId)
      .update({ status: NOTIFICATION_STATUSES.READ, readAt: DateTime.now().toSQL() })
  }

  async markAllAsRead(userId: number): Promise<void> {
    await Notification.query()
      .where('userId', userId)
      .where('status', NOTIFICATION_STATUSES.UNREAD)
      .update({ status: NOTIFICATION_STATUSES.READ, readAt: DateTime.now().toSQL() })
  }

  async getRecentForUser(userId: number, limit = 20): Promise<SerializedNotification[]> {
    const rows = await Notification.query()
      .where('userId', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
    return rows.map(serialize)
  }

  async getUnreadCountForUser(userId: number): Promise<number> {
    const result = await Notification.query()
      .where('userId', userId)
      .where('status', NOTIFICATION_STATUSES.UNREAD)
      .count('* as total')
    return Number(result[0].$extras.total)
  }
}
