import Notification from '#models/notification'
import { NotificationMailService } from '#services/mail/notification_mail_service'
import { MailService } from '#services/mail/mail_service'
import { QUEUE_NAMES } from '#utils/queues/queue_names'
import logger from '@adonisjs/core/services/logger'
import { Job } from '@adonisjs/queue'
import type { JobOptions } from '@adonisjs/queue/types'

type Payload = { notificationId: number }

export default class SendNotificationEmailJob extends Job<Payload> {
  static options: JobOptions = {
    queue: QUEUE_NAMES.default,
    maxRetries: 2,
  }

  async execute() {
    const { notificationId } = this.payload

    const notification = await Notification.query()
      .where('id', notificationId)
      .preload('user')
      .firstOrFail()

    const mailService = new MailService()
    const notificationMailService = new NotificationMailService(mailService)
    await notificationMailService.sendForNotification(notification as any)

    logger.info('SendNotificationEmailJob: email envoyé', {
      notificationId,
      userId: notification.userId,
    })
  }
}
