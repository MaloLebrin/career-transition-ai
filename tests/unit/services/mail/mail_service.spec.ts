import { MailService } from '#services/mail/mail_service'
import { ConsoleMailProvider } from '#services/mail/providers/console_mail_provider'
import { ResendMailProvider } from '#services/mail/providers/resend_mail_provider'
import { overrideEnv } from '#tests/utils/env'
import { test } from '@japa/runner'

/** Fournisseur retenu par le service (champ privé, lu pour le test). */
function providerOf(service: MailService) {
  return (service as unknown as { provider: unknown }).provider
}

test.group('MailService — choix du fournisseur', () => {
  test('console par défaut, sans MAIL_PROVIDER', ({ assert, cleanup }) => {
    cleanup(overrideEnv({ MAIL_PROVIDER: undefined }))
    assert.instanceOf(providerOf(new MailService()), ConsoleMailProvider)
  })

  test('resend quand MAIL_PROVIDER=resend (lu via env)', ({ assert, cleanup }) => {
    cleanup(overrideEnv({ MAIL_PROVIDER: 'resend', RESEND_API_KEY: 're_test_key' }))
    assert.instanceOf(providerOf(new MailService()), ResendMailProvider)
  })

  test('resend sans RESEND_API_KEY échoue explicitement', ({ assert, cleanup }) => {
    cleanup(overrideEnv({ MAIL_PROVIDER: 'resend', RESEND_API_KEY: undefined }))
    assert.throws(() => new MailService(), /RESEND_API_KEY is required/)
  })
})
