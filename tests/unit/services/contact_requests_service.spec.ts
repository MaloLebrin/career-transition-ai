import ContactRequest, { CONTACT_REQUEST_STATUSES } from '#models/contact_request'
import { ContactRequestsService } from '#services/contact_requests_service'
import type { CreateContactRequestInput } from '#shared/types/contact_request/inputs'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

class FakeContactRequestMailService {
  public adminNotificationCalls: ContactRequest[] = []
  public confirmationCalls: ContactRequest[] = []
  public failAdmin = false

  async sendAdminNotification(data: ContactRequest) {
    this.adminNotificationCalls.push(data)
    if (this.failAdmin) throw new Error('Resend indisponible')
  }

  async sendConfirmationToRequester(data: ContactRequest) {
    this.confirmationCalls.push(data)
  }
}

function input(overrides: Partial<CreateContactRequestInput> = {}): CreateContactRequestInput {
  return {
    name: 'Marie Dupont',
    email: 'marie@cabinet.fr',
    phone: null,
    organization: 'Cabinet Test',
    message: 'Bonjour, je souhaite une démo de votre solution.',
    type: 'demo',
    ...overrides,
  }
}

test.group('ContactRequestsService.create', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('enregistre la demande en statut pending', async ({ assert }) => {
    const service = new ContactRequestsService(new FakeContactRequestMailService() as any)

    const created = await service.create(input())

    const saved = await ContactRequest.findOrFail(created.id)
    assert.equal(saved.name, 'Marie Dupont')
    assert.equal(saved.email, 'marie@cabinet.fr')
    assert.equal(saved.organization, 'Cabinet Test')
    assert.equal(saved.type, 'demo')
    assert.equal(saved.status, CONTACT_REQUEST_STATUSES.PENDING)
  })

  test('prévient l’équipe et envoie une confirmation au demandeur', async ({ assert }) => {
    const mails = new FakeContactRequestMailService()
    const service = new ContactRequestsService(mails as any)

    await service.create(input({ type: 'contact', email: 'paul@cabinet.fr' }))

    assert.lengthOf(mails.adminNotificationCalls, 1)
    assert.equal(mails.adminNotificationCalls[0].email, 'paul@cabinet.fr')
    assert.equal(mails.adminNotificationCalls[0].type, 'contact')
    assert.lengthOf(mails.confirmationCalls, 1)
    assert.equal(mails.confirmationCalls[0].email, 'paul@cabinet.fr')
  })

  test('un échec d’envoi n’annule pas la demande', async ({ assert }) => {
    const mails = new FakeContactRequestMailService()
    mails.failAdmin = true
    const service = new ContactRequestsService(mails as any)

    const created = await service.create(input())

    assert.isNotNull(await ContactRequest.find(created.id))
    assert.lengthOf(mails.confirmationCalls, 1)
  })
})
