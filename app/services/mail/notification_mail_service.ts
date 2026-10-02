import type Notification from '#models/notification'
import type User from '#models/user'
import { MailService } from '#services/mail/mail_service'
import type { MailAddress } from '#services/mail/types'
import { NOTIFICATION_TYPES, type NotificationType } from '#shared/constants/notifications'
import env from '#start/env'
import { inject } from '@adonisjs/core'
import app from '@adonisjs/core/services/app'

function resolveFromAddress(): MailAddress {
  const email = String(env.get('MAIL_FROM_EMAIL') ?? '').trim()
  const name = String(env.get('MAIL_FROM_NAME') ?? '').trim()

  if (email) {
    return { email, name: name || undefined }
  }

  if (!app.inProduction) {
    return { email: 'notifications@resend.dev', name: 'Notifications' }
  }

  throw new Error('MAIL_FROM_EMAIL is required in production to send notification emails.')
}

const SUBJECT_BY_TYPE: Record<NotificationType, string> = {
  [NOTIFICATION_TYPES.PDF_EXPORT_COMPLETED]: 'Votre export PDF est prêt',
  [NOTIFICATION_TYPES.EXERCISE_COMPLETED]: 'Un candidat a terminé un exercice',
  [NOTIFICATION_TYPES.AI_SYNTHESIS_READY]: 'Analyse IA disponible pour un candidat',
  [NOTIFICATION_TYPES.STEP_UNLOCKED]: 'Une nouvelle étape de votre parcours est disponible',
  [NOTIFICATION_TYPES.APPOINTMENT_SCHEDULED]: 'Un rendez-vous a été planifié',
  [NOTIFICATION_TYPES.SYNTHESIS_SHARED]: 'Votre synthèse est disponible',
  [NOTIFICATION_TYPES.DATA_ERASURE_REQUESTED]: 'Demande d’effacement de données à traiter',
  [NOTIFICATION_TYPES.AI_ANALYSIS_READY_CANDIDATE]: 'Votre analyse IA est disponible',
  [NOTIFICATION_TYPES.EXPERT_REQUEST_CREATED]: 'Demande d’accompagnement par un expert à traiter',
  [NOTIFICATION_TYPES.EXPERT_ASSIGNED]: 'Votre expert vous accompagne',
  [NOTIFICATION_TYPES.CANDIDATE_ASSIGNED]: 'Nouveau candidat à accompagner',
  [NOTIFICATION_TYPES.EXPERT_REQUEST_DECLINED]: 'Votre demande d’accompagnement',
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
