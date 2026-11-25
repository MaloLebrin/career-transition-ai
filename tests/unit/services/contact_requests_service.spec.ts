import { BlockedContactEmailFactory } from '#database/factories/blocked_contact_email_factory'
import { ContactRequestFactory } from '#database/factories/contact_request_factory'
import { ContactRequestNotFoundError } from '#exceptions/contact_request_errors'
import ContactRequest from '#models/contact_request'
import { CONTACT_REQUEST_STATUSES } from '#shared/constants/contact_request'
import { LIST_PAGE_SIZE } from '#shared/constants/pagination'
import { ContactRequestsService } from '#services/contact_requests_service'
import type { CreateContactRequestInput } from '#shared/types/contact_request/inputs'
import { createAdvisor, createPlatformOrganization } from '#tests/support/actors'
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

    const saved = await ContactRequest.findOrFail(created!.id)
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

  test('adresse bloquée : rien n’est enregistré ni envoyé, sans erreur', async ({ assert }) => {
    await BlockedContactEmailFactory.merge({ email: 'spam@exemple.test' }).create()
    const mails = new FakeContactRequestMailService()
    const service = new ContactRequestsService(mails as any)

    const created = await service.create(input({ email: 'Spam@Exemple.test' }))

    assert.isNull(created)
    assert.isNull(await ContactRequest.query().whereILike('email', 'spam@exemple.test').first())
    assert.lengthOf(mails.adminNotificationCalls, 0)
    assert.lengthOf(mails.confirmationCalls, 0)
  })

  test('un échec d’envoi n’annule pas la demande', async ({ assert }) => {
    const mails = new FakeContactRequestMailService()
    mails.failAdmin = true
    const service = new ContactRequestsService(mails as any)

    const created = await service.create(input())

    assert.isNotNull(await ContactRequest.find(created!.id))
    assert.lengthOf(mails.confirmationCalls, 1)
  })
})

test.group('ContactRequestsService.list / updateStatus (#73)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const service = new ContactRequestsService(new FakeContactRequestMailService() as any)
  const params = { page: 1, search: '', status: null, type: null }

  test('list : plus récentes d’abord, avec filtres de statut et de type', async ({ assert }) => {
    const before = await service.list(params, 0)
    const old = await ContactRequestFactory.merge({ type: 'contact' }).create()
    const recent = await ContactRequestFactory.merge({
      type: 'demo',
      status: CONTACT_REQUEST_STATUSES.TREATED,
    }).create()

    const all = await service.list(params, 0)
    const treated = await service.list({ ...params, status: CONTACT_REQUEST_STATUSES.TREATED }, 0)
    const demos = await service.list({ ...params, type: 'demo' }, 0)

    assert.equal(all.pagination.total, before.pagination.total + 2)
    assert.isBelow(
      all.items.findIndex((r) => r.id === recent.id),
      all.items.findIndex((r) => r.id === old.id)
    )
    assert.include(
      treated.items.map((r) => r.id),
      recent.id
    )
    assert.notInclude(
      treated.items.map((r) => r.id),
      old.id
    )
    assert.isTrue(demos.items.every((r) => r.type === 'demo'))
  })

  test('list : recherche nom / e-mail / organisation, % littéral, pagination', async ({
    assert,
  }) => {
    const target = await ContactRequestFactory.merge({
      name: 'Zélie Quantique',
      email: 'zelie@quantique.test',
      organization: 'Quantique SAS',
    }).create()
    const initial = await service.list(params, 0)
    const base = initial.pagination.total

    const byName = await service.list({ ...params, search: 'zélie' }, 0)
    const byEmail = await service.list({ ...params, search: 'QUANTIQUE.test' }, 0)
    const byOrg = await service.list({ ...params, search: 'quantique sas' }, 0)
    const percent = await service.list({ ...params, search: '%' }, 0)

    for (const result of [byName, byEmail, byOrg]) {
      assert.deepEqual(
        result.items.map((r) => r.id),
        [target.id]
      )
    }
    assert.lengthOf(percent.items, 0)

    await ContactRequestFactory.createMany(LIST_PAGE_SIZE)
    const first = await service.list(params, 0)
    assert.lengthOf(first.items, LIST_PAGE_SIZE)
    assert.equal(first.pagination.total, base + LIST_PAGE_SIZE)
  })

  test('list : chaque demande porte l’état de son expéditeur', async ({ assert }) => {
    const advisor = await createAdvisor()
    await createPlatformOrganization()
    await BlockedContactEmailFactory.merge({ email: advisor.email.toLowerCase() }).create()
    const fromAccount = await ContactRequestFactory.merge({ email: advisor.email }).create()
    const anonymous = await ContactRequestFactory.merge({ email: 'anonyme@exemple.test' }).create()

    const { items } = await service.list(params, 0)

    const known = items.find((r) => r.id === fromAccount.id)!
    assert.isTrue(known.senderBlocked)
    assert.equal(known.account?.id, advisor.id)
    assert.isTrue(known.account?.canDisable)
    const unknown = items.find((r) => r.id === anonymous.id)!
    assert.isFalse(unknown.senderBlocked)
    assert.isNull(unknown.account)
  })

  test('updateStatus : traitée, archivée, remise en attente ; inconnue → 404', async ({
    assert,
  }) => {
    const request = await ContactRequestFactory.create()

    await service.updateStatus(request.id, CONTACT_REQUEST_STATUSES.TREATED)
    await request.refresh()
    assert.equal(request.status, CONTACT_REQUEST_STATUSES.TREATED)

    await service.updateStatus(request.id, CONTACT_REQUEST_STATUSES.PENDING)
    await request.refresh()
    assert.equal(request.status, CONTACT_REQUEST_STATUSES.PENDING)

    await assert.rejects(
      () => service.updateStatus(999999, CONTACT_REQUEST_STATUSES.ARCHIVED),
      ContactRequestNotFoundError
    )
  })
})
