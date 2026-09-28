import { mailProductionErrors } from '#config/mail'
import { test } from '@japa/runner'

/** Garde de démarrage de l'envoi d'e-mails en production (issue #19). */
function errorsFor(values: Record<string, string | undefined>) {
  return mailProductionErrors((name) => values[name])
}

const RESEND_OK = {
  MAIL_PROVIDER: 'resend',
  RESEND_API_KEY: 're_123',
  MAIL_FROM_EMAIL: 'no-reply@mon-domaine.fr',
}

test.group('config/mail — mailProductionErrors', () => {
  test('aucune erreur avec Resend et un domaine vérifié', ({ assert }) => {
    assert.deepEqual(errorsFor(RESEND_OK), [])
  })

  test('aucune exigence en mode console ou sans provider', ({ assert }) => {
    assert.deepEqual(errorsFor({ MAIL_PROVIDER: 'console' }), [])
    assert.deepEqual(errorsFor({}), [])
  })

  test('exige RESEND_API_KEY', ({ assert }) => {
    assert.deepEqual(errorsFor({ ...RESEND_OK, RESEND_API_KEY: '  ' }), [
      'RESEND_API_KEY manquante',
    ])
  })

  test('exige MAIL_FROM_EMAIL', ({ assert }) => {
    assert.deepEqual(errorsFor({ ...RESEND_OK, MAIL_FROM_EMAIL: undefined }), [
      'MAIL_FROM_EMAIL manquante',
    ])
  })

  test('refuse un expéditeur @resend.dev (domaine non vérifié)', ({ assert }) => {
    const [error] = errorsFor({ ...RESEND_OK, MAIL_FROM_EMAIL: 'Onboarding@Resend.dev' })
    assert.match(error, /resend\.dev/)
  })
})
