import OnboardingToken from '#models/onboarding_token'
import Organization from '#models/organization'
import User from '#models/user'
import { MailService } from '#services/mail/mail_service'
import type { MailMessage, MailProvider } from '#services/mail/types'
import { OnboardingMailService } from '#services/onboarding_mail_service'
import { withEnv } from '#tests/utils/env'
import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'

/** Fournisseur factice : enregistre les messages au lieu de les envoyer. */
function makeService() {
  const sent: MailMessage[] = []
  const provider: MailProvider = {
    async send(message) {
      sent.push(message)
    },
  }
  return { service: new OnboardingMailService(MailService.withProvider(provider)), sent }
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
  user.merge({ id: 12, email: 'claire@example.com', name: 'Claire Martin' })
  const token = new OnboardingToken()
  token.merge({ id: 5, userId: 12, token: OnboardingToken.hash('abc123') })
  token.plainToken = 'abc123'
  const organization = new Organization()
  organization.merge({ id: 3, name: 'ACME RH' })
  return { user, token, organization }
}

const BASE_URL = 'https://app.example.test'

test.group('OnboardingMailService.sendSetPasswordLink', () => {
  test('envoie le lien de création de mot de passe au candidat', async ({ assert }) => {
    const { service, sent } = makeService()
    const { user, token } = fixtures()

    await withEnv({ MAIL_FROM_EMAIL: undefined, MAIL_FROM_NAME: undefined }, () =>
      service.sendSetPasswordLink({ user, token, baseUrl: BASE_URL })
    )

    assert.lengthOf(sent, 1)
    const [mail] = sent
    assert.deepEqual(mail.to, { email: 'claire@example.com', name: 'Claire Martin' })
    assert.equal(mail.subject, 'Créez votre mot de passe')
    assert.include(mail.text!, 'Bonjour Claire Martin,')
    assert.include(mail.text!, `${BASE_URL}/onboarding/abc123`)
    assert.deepEqual(mail.tags, ['onboarding'])
    assert.deepEqual(mail.metadata, { kind: 'onboarding', userId: 12 })
    // Hors production, expéditeur de repli sans vérification de domaine.
    assert.deepEqual(mail.from, { email: 'onboarding@resend.dev', name: 'Onboarding' })
  })
})

test.group('OnboardingMailService.sendInviteAdvisorLink', () => {
  test("invite un conseiller en nommant l'organisation", async ({ assert }) => {
    const { service, sent } = makeService()
    const { user, token, organization } = fixtures()

    await service.sendInviteAdvisorLink({ user, token, organization, baseUrl: BASE_URL })

    assert.lengthOf(sent, 1)
    const [mail] = sent
    assert.deepEqual(mail.to, { email: 'claire@example.com', name: 'Claire Martin' })
    assert.equal(mail.subject, "Invitation à rejoindre l'organisation ACME RH")
    assert.include(mail.text!, "Vous avez été invité à rejoindre l'organisation ACME RH.")
    assert.include(mail.text!, `${BASE_URL}/onboarding/abc123`)
    assert.deepEqual(mail.tags, ['onboarding'])
    assert.deepEqual(mail.metadata, { kind: 'onboarding', userId: 12 })
  })
})

test.group('OnboardingMailService — expéditeur', () => {
  test('utilise MAIL_FROM_EMAIL / MAIL_FROM_NAME (espaces retirés)', async ({ assert }) => {
    const { service, sent } = makeService()
    const { user, token } = fixtures()

    await withEnv({ MAIL_FROM_EMAIL: '  noreply@example.com ', MAIL_FROM_NAME: ' Équipe ' }, () =>
      service.sendSetPasswordLink({ user, token, baseUrl: BASE_URL })
    )

    assert.deepEqual(sent[0].from, { email: 'noreply@example.com', name: 'Équipe' })
  })

  test('sans MAIL_FROM_NAME, le nom est omis', async ({ assert }) => {
    const { service, sent } = makeService()
    const { user, token } = fixtures()

    await withEnv({ MAIL_FROM_EMAIL: 'noreply@example.com', MAIL_FROM_NAME: undefined }, () =>
      service.sendSetPasswordLink({ user, token, baseUrl: BASE_URL })
    )

    assert.deepEqual(sent[0].from, { email: 'noreply@example.com', name: undefined })
  })

  test('en production, MAIL_FROM_EMAIL est obligatoire et rien n’est envoyé', async ({
    assert,
    cleanup,
  }) => {
    const { service, sent } = makeService()
    const { user, token } = fixtures()
    forceProduction(cleanup)

    await withEnv({ MAIL_FROM_EMAIL: undefined }, () =>
      assert.rejects(
        () => service.sendSetPasswordLink({ user, token, baseUrl: BASE_URL }),
        'MAIL_FROM_EMAIL is required in production to send emails.'
      )
    )
    assert.lengthOf(sent, 0)
  })
})

test.group('OnboardingMailService — secret du lien', () => {
  /** #65 : la base ne stocke que l'empreinte ; sans secret, aucun lien n'est envoyé. */
  test('refuse un jeton relu en base (sans secret en clair)', async ({ assert }) => {
    const { service, sent } = makeService()
    const { user } = fixtures()
    const stored = new OnboardingToken()
    stored.merge({ id: 6, userId: 12, token: OnboardingToken.hash('abc123') })

    await assert.rejects(() =>
      service.sendSetPasswordLink({ user, token: stored, baseUrl: BASE_URL })
    )
    assert.lengthOf(sent, 0)
  })
})
