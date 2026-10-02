import OnboardingToken from '#models/onboarding_token'
import User from '#models/user'
import {
  EMAIL_VERIFICATION_TOKEN_TTL_DAYS,
  EmailVerificationMailService,
} from '#services/mail/email_verification_mail_service'
import { MailService } from '#services/mail/mail_service'
import type { MailMessage, MailProvider } from '#services/mail/types'
import { withEnv } from '#tests/utils/env'
import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'

function makeService() {
  const sent: MailMessage[] = []
  const provider: MailProvider = {
    async send(message) {
      sent.push(message)
    },
  }
  return { service: new EmailVerificationMailService(MailService.withProvider(provider)), sent }
}

/** Simule la production le temps du test (`app.inProduction` est un getter du prototype). */
function forceProduction(cleanup: (fn: () => void) => void) {
  Object.defineProperty(app, 'inProduction', { value: true, configurable: true })
  cleanup(() => {
    delete (app as unknown as Record<string, unknown>).inProduction
  })
}

// Modèles en mémoire : le service ne lit que des attributs, aucune écriture en base.
function fixtures() {
  const user = new User()
  user.merge({ id: 12, email: 'camille@example.com', name: 'Camille Durand' })
  const token = new OnboardingToken()
  token.merge({ id: 5, userId: 12, token: OnboardingToken.hash('abc123') })
  token.plainToken = 'abc123'
  return { user, token }
}

const ENV = {
  APP_URL: 'https://app.example.test/',
  MAIL_FROM_EMAIL: undefined,
  MAIL_FROM_NAME: undefined,
}

test.group('EmailVerificationMailService.sendVerificationLink (#98)', () => {
  test('envoie le lien bâti sur APP_URL, avec sa durée de validité', async ({ assert }) => {
    const { service, sent } = makeService()
    const { user, token } = fixtures()

    await withEnv(ENV, () => service.sendVerificationLink({ user, token }))

    assert.lengthOf(sent, 1)
    const [mail] = sent
    assert.deepEqual(mail.to, { email: 'camille@example.com', name: 'Camille Durand' })
    assert.equal(mail.subject, 'Confirmez votre adresse e-mail')
    assert.include(mail.text!, 'Bonjour Camille Durand,')
    assert.include(mail.text!, 'https://app.example.test/auth/verify-email/abc123')
    assert.include(mail.text!, `${EMAIL_VERIFICATION_TOKEN_TTL_DAYS} jours`)
    assert.deepEqual(mail.tags, ['email_verification'])
    assert.deepEqual(mail.metadata, { kind: 'email_verification', userId: 12 })
    assert.deepEqual(mail.from, { email: 'onboarding@resend.dev', name: 'Inscription' })
  })

  test('utilise MAIL_FROM_EMAIL / MAIL_FROM_NAME quand ils sont définis', async ({ assert }) => {
    const { service, sent } = makeService()
    const { user, token } = fixtures()

    await withEnv(
      { ...ENV, MAIL_FROM_EMAIL: 'no-reply@example.test', MAIL_FROM_NAME: 'Transition Carrière' },
      () => service.sendVerificationLink({ user, token })
    )

    assert.deepEqual(sent[0].from, { email: 'no-reply@example.test', name: 'Transition Carrière' })
  })

  test('refuse un jeton relu depuis la base (secret absent)', async ({ assert }) => {
    const { service, sent } = makeService()
    const { user, token } = fixtures()
    token.plainToken = undefined

    await assert.rejects(
      () => withEnv(ENV, () => service.sendVerificationLink({ user, token })),
      /only available right after createForUser/
    )
    assert.lengthOf(sent, 0)
  })

  test('en production sans MAIL_FROM_EMAIL : refuse d’envoyer', async ({ assert, cleanup }) => {
    const { service, sent } = makeService()
    const { user, token } = fixtures()
    forceProduction(cleanup)

    await assert.rejects(
      () => withEnv(ENV, () => service.sendVerificationLink({ user, token })),
      /MAIL_FROM_EMAIL is required in production/
    )
    assert.lengthOf(sent, 0)
  })
})
