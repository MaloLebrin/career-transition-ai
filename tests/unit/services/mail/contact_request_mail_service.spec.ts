import { test } from '@japa/runner'
import {
  ContactRequestMailService,
  DEFAULT_ADMIN_CONTACT_EMAIL,
  DEFAULT_CONTACT_FROM_EMAIL,
} from '#services/mail/contact_request_mail_service'
import { MailService } from '#services/mail/mail_service'
import type { MailMessage, MailProvider } from '#services/mail/types'
import env from '#start/env'
import { withEnv } from '#tests/utils/env'

/** Fournisseur factice : enregistre les messages au lieu de les envoyer. */
function makeService() {
  const sent: MailMessage[] = []
  const provider: MailProvider = {
    async send(message) {
      sent.push(message)
    },
  }
  return { service: new ContactRequestMailService(MailService.withProvider(provider)), sent }
}

// Valeurs de l'env de test (défauts si non définies).
const ADMIN_EMAIL = env.get('ADMIN_CONTACT_EMAIL') || DEFAULT_ADMIN_CONTACT_EMAIL
const FROM_EMAIL = env.get('MAIL_FROM_EMAIL') || DEFAULT_CONTACT_FROM_EMAIL

const demo = {
  name: 'Jeanne Dupont',
  email: 'jeanne@example.com',
  phone: '06 00 00 00 00',
  organization: 'ACME RH',
  message: 'Bonjour,\nJe souhaite une démo.',
  type: 'demo' as const,
}

test.group('ContactRequestMailService.sendAdminNotification', () => {
  test("envoie une demande de démo à l'administrateur avec toutes les coordonnées", async ({
    assert,
  }) => {
    const { service, sent } = makeService()

    await service.sendAdminNotification(demo)

    assert.lengthOf(sent, 1)
    const [mail] = sent
    assert.equal(mail.from.email, FROM_EMAIL)
    assert.deepInclude(mail.to, { email: ADMIN_EMAIL })
    assert.equal(mail.subject, '[Demande de démo] Jeanne Dupont — ACME RH')
    assert.deepEqual(mail.tags, ['contact-request', 'demo'])
    assert.include(mail.html!, 'Téléphone')
    assert.include(mail.html!, 'Organisation')
    assert.include(mail.text!, 'Téléphone : 06 00 00 00 00')
    assert.include(mail.text!, 'Organisation : ACME RH')
    assert.include(mail.text!, 'Bonjour,\nJe souhaite une démo.')
  })

  test("prise de contact sans téléphone ni organisation : sujet sur l'email, lignes omises", async ({
    assert,
  }) => {
    const { service, sent } = makeService()

    await service.sendAdminNotification({
      name: 'Paul',
      email: 'paul@example.com',
      phone: null,
      organization: null,
      message: 'Question',
      type: 'contact',
    })

    const [mail] = sent
    assert.equal(mail.subject, '[Prise de contact] Paul — paul@example.com')
    assert.deepEqual(mail.tags, ['contact-request', 'contact'])
    assert.notInclude(mail.html!, 'Téléphone')
    assert.notInclude(mail.html!, 'Organisation')
    assert.notInclude(mail.text!, 'Téléphone')
    assert.notInclude(mail.text!, 'null')
    assert.equal(mail.text!.split('\n')[0], 'Prise de contact')
  })

  test('échappe le HTML des champs saisis par le visiteur', async ({ assert }) => {
    const { service, sent } = makeService()

    await service.sendAdminNotification({
      ...demo,
      name: '<script>alert("x")</script>',
      organization: "L'Atelier & Co",
      message: '<b>gras</b>',
    })

    const html = sent[0].html!
    assert.notInclude(html, '<script>')
    assert.include(html, '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;')
    assert.include(html, 'L&#039;Atelier &amp; Co')
    assert.include(html, '&lt;b&gt;gras&lt;/b&gt;')
  })
})

test.group('ContactRequestMailService.sendConfirmationToRequester', () => {
  test('confirme une demande de démo au demandeur', async ({ assert }) => {
    const { service, sent } = makeService()

    await service.sendConfirmationToRequester(demo)

    assert.lengthOf(sent, 1)
    const [mail] = sent
    assert.deepEqual(mail.to, { email: 'jeanne@example.com', name: 'Jeanne Dupont' })
    assert.equal(mail.subject, 'Votre demande de démo a bien été reçu — France Transition Carrière')
    assert.deepEqual(mail.tags, ['contact-confirmation', 'demo'])
    assert.include(mail.html!, 'Bonjour Jeanne Dupont,')
    assert.include(mail.text!, 'Nous avons bien reçu votre demande de démo')
    assert.include(mail.text!, demo.message)
  })

  test('parle de « message » pour une prise de contact et échappe le HTML', async ({ assert }) => {
    const { service, sent } = makeService()

    await service.sendConfirmationToRequester({
      name: '<i>Paul</i>',
      email: 'paul@example.com',
      message: 'a < b',
      type: 'contact',
    })

    const [mail] = sent
    assert.equal(mail.subject, 'Votre message a bien été reçu — France Transition Carrière')
    assert.deepEqual(mail.tags, ['contact-confirmation', 'contact'])
    assert.include(mail.html!, 'Bonjour &lt;i&gt;Paul&lt;/i&gt;,')
    assert.include(mail.html!, 'a &lt; b')
    // Le texte brut n'est pas échappé.
    assert.include(mail.text!, 'Bonjour <i>Paul</i>,')
  })
})

test.group('ContactRequestMailService — configuration', () => {
  test("lit ADMIN_CONTACT_EMAIL et MAIL_FROM_* à l'envoi, pas au chargement du module", async ({
    assert,
  }) => {
    const { service, sent } = makeService()

    await withEnv(
      {
        ADMIN_CONTACT_EMAIL: 'equipe@example.com',
        MAIL_FROM_EMAIL: 'ne-pas-repondre@example.com',
        MAIL_FROM_NAME: 'Équipe test',
      },
      () => service.sendAdminNotification(demo)
    )

    assert.lengthOf(sent, 1)
    assert.deepEqual(sent[0].from, { email: 'ne-pas-repondre@example.com', name: 'Équipe test' })
    assert.deepInclude(sent[0].to, { email: 'equipe@example.com' })
  })
})
