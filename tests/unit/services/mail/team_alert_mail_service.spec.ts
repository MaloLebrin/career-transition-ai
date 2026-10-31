import { MailService } from '#services/mail/mail_service'
import { TeamAlertMailService } from '#services/mail/team_alert_mail_service'
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
  return { service: new TeamAlertMailService(MailService.withProvider(provider)), sent }
}

const ENV = {
  PAYMENT_ALERT_EMAIL: 'paiements@example.test',
  EXPERT_REQUEST_ALERT_EMAIL: 'accompagnement@example.test',
}

test.group('TeamAlertMailService.paymentReceived', () => {
  test('envoie le paiement à PAYMENT_ALERT_EMAIL, id du candidat seulement', async ({ assert }) => {
    const { service, sent } = makeService()

    const result = await withEnv(ENV, () =>
      service.paymentReceived({
        paymentId: 12,
        employeeId: 34,
        amountCents: 4500,
        discountCents: 500,
        currency: 'eur',
        promoCode: 'BIENVENUE',
      })
    )

    assert.isTrue(result)
    assert.lengthOf(sent, 1)
    assert.equal(sent[0].to.email, 'paiements@example.test')
    assert.equal(sent[0].subject, 'Nouveau paiement — candidat #34')
    assert.include(sent[0].text!, 'Paiement : #12')
    assert.match(sent[0].text!, /Montant encaissé : 45,00\s€/)
    assert.include(sent[0].text!, 'Code promo : BIENVENUE')
    assert.deepEqual(sent[0].tags, ['team-alert', 'payment_received'])
  })

  test('sans remise ni code promo, ces lignes sont omises', async ({ assert }) => {
    const { service, sent } = makeService()

    await withEnv(ENV, () =>
      service.paymentReceived({
        paymentId: 1,
        employeeId: 2,
        amountCents: 5000,
        discountCents: 0,
        currency: 'eur',
        promoCode: null,
      })
    )

    assert.notInclude(sent[0].text!, 'Remise')
    assert.notInclude(sent[0].text!, 'Code promo')
  })

  test('PAYMENT_ALERT_EMAIL absent : aucun envoi', async ({ assert }) => {
    const { service, sent } = makeService()

    const result = await withEnv({ ...ENV, PAYMENT_ALERT_EMAIL: undefined }, () =>
      service.paymentReceived({
        paymentId: 1,
        employeeId: 2,
        amountCents: 5000,
        discountCents: 0,
        currency: 'eur',
        promoCode: null,
      })
    )

    assert.isFalse(result)
    assert.lengthOf(sent, 0)
  })
})

test.group('TeamAlertMailService.expertRequested', () => {
  test('envoie la demande à EXPERT_REQUEST_ALERT_EMAIL (adresse distincte)', async ({ assert }) => {
    const { service, sent } = makeService()

    const result = await withEnv(ENV, () =>
      service.expertRequested({
        expertRequestId: 7,
        employeeId: 34,
        availability: 'Le mardi soir',
      })
    )

    assert.isTrue(result)
    assert.lengthOf(sent, 1)
    assert.equal(sent[0].to.email, 'accompagnement@example.test')
    assert.equal(sent[0].subject, 'Demande d’accompagnement — candidat #34')
    assert.include(sent[0].text!, 'Demande : #7')
    assert.include(sent[0].text!, 'Disponibilités : Le mardi soir')
    assert.deepEqual(sent[0].tags, ['team-alert', 'expert_request_created'])
  })

  test('EXPERT_REQUEST_ALERT_EMAIL absent (ou vide) : aucun envoi', async ({ assert }) => {
    const { service, sent } = makeService()

    const result = await withEnv({ ...ENV, EXPERT_REQUEST_ALERT_EMAIL: '  ' }, () =>
      service.expertRequested({ expertRequestId: 7, employeeId: 34, availability: null })
    )

    assert.isFalse(result)
    assert.lengthOf(sent, 0)
  })
})
