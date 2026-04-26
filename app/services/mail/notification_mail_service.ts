import type Notification from '#models/notification'
import type User from '#models/user'
import { MailService } from '#services/mail/mail_service'
import type { MailAddress } from '#services/mail/types'
import { NOTIFICATION_TYPES } from '#shared/constants/notifications'
import { inject } from '@adonisjs/core'

function resolveFromAddress(): MailAddress {
  const email = String(process.env.MAIL_FROM_EMAIL ?? '').trim()
  const name = String(process.env.MAIL_FROM_NAME ?? '').trim()

  if (email) {
    return { email, name: name || undefined }
  }

  if (process.env.NODE_ENV !== 'production') {
    return { email: 'notifications@resend.dev', name: 'Notifications' }
  }

  throw new Error('MAIL_FROM_EMAIL is required in production to send notification emails.')
}

const SUBJECT_BY_TYPE: Record<string, string> = {
  [NOTIFICATION_TYPES.PDF_EXPORT_COMPLETED]: 'Votre export PDF est prêt',
  [NOTIFICATION_TYPES.EXERCISE_COMPLETED]: 'Un candidat a terminé un exercice',
  [NOTIFICATION_TYPES.AI_SYNTHESIS_READY]: 'Analyse IA disponible pour un candidat',
}

type NotificationWithUser = Notification & { user: User }

@inject()
export class NotificationMailService {
  constructor(private mail: MailService) {}

  async sendForNotification(notification: NotificationWithUser): Promise<void> {
    const subject = SUBJECT_BY_TYPE[notification.type] ?? notification.title
    const bodyLines = [notification.title]
    if (notification.body) bodyLines.push('', notification.body)

    await this.mail.send({
      from: resolveFromAddress(),
      to: { email: notification.user.email, name: notification.user.name },
      subject,
      text: bodyLines.join('\n'),
      tags: ['notification', notification.type],
      metadata: {
        kind: 'notification',
        notificationId: notification.id,
        type: notification.type,
      },
    })
  }
}
