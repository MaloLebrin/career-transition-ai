import PasswordResetToken from '#models/password_reset_token'
import User from '#models/user'
import { MailService } from '#services/mail/mail_service'
import { PasswordMailService } from '#services/mail/password_mail_service'
import type { MailMessage, MailProvider } from '#services/mail/types'
import { withEnv } from '#tests/utils/env'
import { test } from '@japa/runner'

function makeService() {
  const sent: MailMessage[] = []
  const provider: MailProvider = {
    async send(message) {
      sent.push(message)
    },
  }
  return { service: new PasswordMailService(MailService.withProvider(provider)), sent }
}

// Modèles en mémoire : le service ne lit que des attributs, aucune écriture en base.
function fixtures() {
  const user = new User()
  user.merge({ id: 12, email: 'claire@example.com', name: 'Claire Martin' })
  const token = new PasswordResetToken()
  token.merge({ id: 5, userId: 12, token: PasswordResetToken.hash('abc123') })
  token.plainToken = 'abc123'
  return { user, token }
}

const ENV = {
  APP_URL: 'https://app.example.test/',
  MAIL_FROM_EMAIL: undefined,
  MAIL_FROM_NAME: undefined,
}

test.group('PasswordMailService.sendResetLink', () => {
  test('envoie le lien bâti sur APP_URL, avec sa durée de validité', async ({ assert }) => {
    const { service, sent } = makeService()
    const { user, token } = fixtures()

    await withEnv(ENV, () => service.sendResetLink({ user, token }))

    assert.lengthOf(sent, 1)
    const [mail] = sent
    assert.deepEqual(mail.to, { email: 'claire@example.com', name: 'Claire Martin' })
    assert.equal(mail.subject, 'Réinitialisez votre mot de passe')
    assert.include(mail.text!, 'https://app.example.test/auth/password-reset/abc123')
    assert.include(mail.text!, '60 minutes')
    assert.deepEqual(mail.metadata, { kind: 'password_reset', userId: 12 })
  })

  test('refuse un jeton relu depuis la base (secret absent)', async ({ assert }) => {
    const { service, sent } = makeService()
    const { user, token } = fixtures()
    token.plainToken = undefined

    await assert.rejects(
      () => withEnv(ENV, () => service.sendResetLink({ user, token })),
      /only available right after createForUser/
    )
    assert.lengthOf(sent, 0)
  })
})

test.group('PasswordMailService.sendPasswordChanged', () => {
  test('prévient le titulaire et pointe vers « mot de passe oublié »', async ({ assert }) => {
    const { service, sent } = makeService()
    const { user } = fixtures()

    await withEnv(ENV, () => service.sendPasswordChanged({ user }))

    const [mail] = sent
    assert.equal(mail.subject, 'Votre mot de passe a été modifié')
    assert.include(mail.text!, 'https://app.example.test/auth/forgot-password')
    assert.notInclude(mail.text!, 'password-reset/')
  })
})
