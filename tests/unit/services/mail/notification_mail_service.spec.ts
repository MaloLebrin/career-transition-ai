import Notification from '#models/notification'
import User from '#models/user'
import { MailService } from '#services/mail/mail_service'
import { NotificationMailService } from '#services/mail/notification_mail_service'
import type { MailMessage, MailProvider } from '#services/mail/types'
import { NOTIFICATION_TYPES } from '#shared/constants/notifications'
import { withEnv } from '#tests/utils/env'
import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'

type NotificationWithUser = Parameters<NotificationMailService['sendForNotification']>[0]

function makeService() {
  const sent: MailMessage[] = []
  const provider: MailProvider = {
    async send(message) {
      sent.push(message)
    },
  }
  return { service: new NotificationMailService(MailService.withProvider(provider)), sent }
}

/** Notification en mémoire avec son destinataire (le service ne touche pas la base). */
function makeNotification(attrs: {
  type: string
  title: string
  body?: string | null
}): NotificationWithUser {
  const user = new User()
  user.merge({ id: 4, email: 'conseil@example.com', name: 'Paul Conseil' })
  const notification = new Notification()
  notification.merge({ id: 99, userId: 4, body: null, ...attrs } as Partial<Notification>)
  notification.$setRelated('user' as never, user as never)
  return notification as NotificationWithUser
}

test.group('NotificationMailService.sendForNotification', () => {
  test('sujet dédié par type, titre + corps dans le texte', async ({ assert }) => {
    const { service, sent } = makeService()

    await withEnv({ MAIL_FROM_EMAIL: undefined, MAIL_FROM_NAME: undefined }, () =>
      service.sendForNotification(
        makeNotification({
          type: NOTIFICATION_TYPES.PDF_EXPORT_COMPLETED,
          title: 'Export terminé',
          body: 'Le fichier est disponible.',
        })
      )
    )

    assert.lengthOf(sent, 1)
    const [mail] = sent
    assert.deepEqual(mail.to, { email: 'conseil@example.com', name: 'Paul Conseil' })
    assert.equal(mail.subject, 'Votre export PDF est prêt')
    assert.equal(mail.text, 'Export terminé\n\nLe fichier est disponible.')
    assert.deepEqual(mail.tags, ['notification', NOTIFICATION_TYPES.PDF_EXPORT_COMPLETED])
    assert.deepEqual(mail.metadata, {
      kind: 'notification',
      notificationId: 99,
      type: NOTIFICATION_TYPES.PDF_EXPORT_COMPLETED,
    })
    assert.deepEqual(mail.from, { email: 'notifications@resend.dev', name: 'Notifications' })
  })

  test('chaque type connu a son propre sujet', async ({ assert }) => {
    const { service, sent } = makeService()

    await service.sendForNotification(
      makeNotification({ type: NOTIFICATION_TYPES.EXERCISE_COMPLETED, title: 't' })
    )
    await service.sendForNotification(
      makeNotification({ type: NOTIFICATION_TYPES.AI_SYNTHESIS_READY, title: 't' })
    )

    assert.deepEqual(
      sent.map((m) => m.subject),
      ['Un candidat a terminé un exercice', 'Analyse IA disponible pour un candidat']
    )
  })

  test('sans corps, le texte se limite au titre', async ({ assert }) => {
    const { service, sent } = makeService()

    await service.sendForNotification(
      makeNotification({ type: NOTIFICATION_TYPES.EXERCISE_COMPLETED, title: 'Seul titre' })
    )

    assert.equal(sent[0].text, 'Seul titre')
  })

  test('type inconnu : le titre sert de sujet', async ({ assert }) => {
    const { service, sent } = makeService()

    await service.sendForNotification(
      makeNotification({ type: 'custom_type', title: 'Titre libre' })
    )

    assert.equal(sent[0].subject, 'Titre libre')
    assert.deepEqual(sent[0].tags, ['notification', 'custom_type'])
  })

  test('expéditeur lu dans MAIL_FROM_* à l’envoi', async ({ assert }) => {
    const { service, sent } = makeService()

    await withEnv({ MAIL_FROM_EMAIL: 'alertes@example.com', MAIL_FROM_NAME: 'Alertes' }, () =>
      service.sendForNotification(
        makeNotification({ type: NOTIFICATION_TYPES.EXERCISE_COMPLETED, title: 't' })
      )
    )

    assert.deepEqual(sent[0].from, { email: 'alertes@example.com', name: 'Alertes' })
  })

  test('en production sans MAIL_FROM_EMAIL : erreur, aucun envoi', async ({ assert, cleanup }) => {
    const { service, sent } = makeService()
    Object.defineProperty(app, 'inProduction', { value: true, configurable: true })
    cleanup(() => {
      delete (app as unknown as Record<string, unknown>).inProduction
    })

    await withEnv({ MAIL_FROM_EMAIL: undefined }, () =>
      assert.rejects(
        () =>
          service.sendForNotification(
            makeNotification({ type: NOTIFICATION_TYPES.EXERCISE_COMPLETED, title: 't' })
          ),
        'MAIL_FROM_EMAIL is required in production to send notification emails.'
      )
    )
    assert.lengthOf(sent, 0)
  })
})
