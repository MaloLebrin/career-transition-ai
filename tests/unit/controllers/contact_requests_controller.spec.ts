import ContactRequestsController from '#controllers/contact_requests_controller'
import ContactRequest, { CONTACT_REQUEST_STATUSES } from '#models/contact_request'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

interface NotificationCall {
  name: string
  email: string
  type: string
}

class FakeContactRequestMailService {
  public adminNotificationCalls: NotificationCall[] = []
  public confirmationCalls: NotificationCall[] = []

  async sendAdminNotification(data: NotificationCall) {
    this.adminNotificationCalls.push(data)
  }

  async sendConfirmationToRequester(data: NotificationCall) {
    this.confirmationCalls.push(data)
  }
}

function makeResponse() {
  let createdBody: unknown = null
  return {
    createdBody,
    created(body: unknown) {
      this.createdBody = body
      return this
    },
  }
}

test.group('ContactRequestsController.store', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('persists contact request in database and returns 201', async ({ assert }) => {
    const mailService = new FakeContactRequestMailService()
    const controller = new ContactRequestsController(mailService as any)
    const response = makeResponse()

    const payload = {
      name: 'Marie Dupont',
      email: 'marie@cabinet.fr',
      phone: null,
      organization: 'Cabinet Test',
      message: 'Bonjour, je souhaite une démo de votre solution.',
      type: 'demo' as const,
    }

    await controller.store({
      request: { validateUsing: () => Promise.resolve(payload) },
      response: response as any,
    } as any)

    const saved = await ContactRequest.query().where('email', payload.email).first()
    assert.isNotNull(saved)
    assert.equal(saved!.name, payload.name)
    assert.equal(saved!.email, payload.email)
    assert.equal(saved!.organization, payload.organization)
    assert.equal(saved!.type, 'demo')
    assert.equal(saved!.status, CONTACT_REQUEST_STATUSES.PENDING)
    assert.deepEqual((response.createdBody as any)?.success, true)
  })

  test('sends admin notification and confirmation emails', async ({ assert }) => {
    const mailService = new FakeContactRequestMailService()
    const controller = new ContactRequestsController(mailService as any)
    const response = makeResponse()

    const payload = {
      name: 'Paul Martin',
      email: 'paul@cabinet.fr',
      phone: null,
      organization: null,
      message: 'Je voudrais en savoir plus sur votre offre.',
      type: 'contact' as const,
    }

    await controller.store({
      request: { validateUsing: () => Promise.resolve(payload) },
      response: response as any,
    } as any)

    assert.lengthOf(mailService.adminNotificationCalls, 1)
    assert.equal(mailService.adminNotificationCalls[0].email, payload.email)
    assert.equal(mailService.adminNotificationCalls[0].type, 'contact')

    assert.lengthOf(mailService.confirmationCalls, 1)
    assert.equal(mailService.confirmationCalls[0].email, payload.email)
  })

  test('sets status to pending on creation', async ({ assert }) => {
    const mailService = new FakeContactRequestMailService()
    const controller = new ContactRequestsController(mailService as any)

    await controller.store({
      request: {
        validateUsing: () =>
          Promise.resolve({
            name: 'Test User',
            email: 'test@example.com',
            phone: null,
            organization: null,
            message: 'Message de test suffisamment long.',
            type: 'demo' as const,
          }),
      },
      response: makeResponse() as any,
    } as any)

    const saved = await ContactRequest.query().where('email', 'test@example.com').first()
    assert.equal(saved!.status, CONTACT_REQUEST_STATUSES.PENDING)
  })
})
