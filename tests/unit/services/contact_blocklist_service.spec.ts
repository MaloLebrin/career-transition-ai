import { BlockedContactEmailFactory } from '#database/factories/blocked_contact_email_factory'
import { ContactRequestFactory } from '#database/factories/contact_request_factory'
import { ContactRequestNotFoundError } from '#exceptions/contact_request_errors'
import BlockedContactEmail from '#models/blocked_contact_email'
import { ContactBlocklistService } from '#services/contact_blocklist_service'
import { CONTACT_REQUEST_STATUSES } from '#shared/constants/contact_request'
import {
  createAdvisor,
  createB2cCandidate,
  createInHouseExpert,
  createSuperAdmin,
} from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

test.group('ContactBlocklistService — blocage d’une adresse', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const service = new ContactBlocklistService()

  test('isBlocked compare sans casse ni espaces', async ({ assert }) => {
    await BlockedContactEmailFactory.merge({ email: 'spam@exemple.test' }).create()

    assert.isTrue(await service.isBlocked('spam@exemple.test'))
    assert.isTrue(await service.isBlocked('  SPAM@Exemple.TEST '))
    assert.isFalse(await service.isBlocked('autre@exemple.test'))
  })

  test('blockSender enregistre l’adresse en minuscules, avec son auteur, et reste idempotent', async ({
    assert,
  }) => {
    const actor = await createSuperAdmin()
    const request = await ContactRequestFactory.merge({ email: 'Spam@Exemple.test' }).create()

    const returned = await service.blockSender(actor, request.id)
    await service.blockSender(actor, request.id)

    const rows = await BlockedContactEmail.query().where('email', 'spam@exemple.test')
    assert.lengthOf(rows, 1)
    assert.equal(rows[0].blockedByUserId, actor.id)
    assert.equal(returned.id, request.id)
  })

  test('blockSender archive les demandes à traiter de l’adresse, et seulement elles', async ({
    assert,
  }) => {
    const actor = await createSuperAdmin()
    const request = await ContactRequestFactory.merge({ email: 'spam@exemple.test' }).create()
    const sameSender = await ContactRequestFactory.merge({ email: 'SPAM@exemple.test' }).create()
    const treated = await ContactRequestFactory.merge({
      email: 'spam@exemple.test',
      status: CONTACT_REQUEST_STATUSES.TREATED,
    }).create()
    const other = await ContactRequestFactory.merge({ email: 'autre@exemple.test' }).create()

    await service.blockSender(actor, request.id)

    await Promise.all([request, sameSender, treated, other].map((row) => row.refresh()))
    assert.equal(request.status, CONTACT_REQUEST_STATUSES.ARCHIVED)
    assert.equal(sameSender.status, CONTACT_REQUEST_STATUSES.ARCHIVED)
    assert.equal(treated.status, CONTACT_REQUEST_STATUSES.TREATED)
    assert.equal(other.status, CONTACT_REQUEST_STATUSES.PENDING)
  })

  test('unblockSender lève le blocage et reste sans effet sur une adresse libre', async ({
    assert,
  }) => {
    const actor = await createSuperAdmin()
    const request = await ContactRequestFactory.merge({ email: 'spam@exemple.test' }).create()
    await service.blockSender(actor, request.id)

    await service.unblockSender(request.id)
    await service.unblockSender(request.id)

    assert.isFalse(await service.isBlocked('spam@exemple.test'))
  })

  test('demande inconnue → 404', async ({ assert }) => {
    const actor = await createSuperAdmin()

    await assert.rejects(() => service.findRequest(999999), ContactRequestNotFoundError)
    await assert.rejects(() => service.blockSender(actor, 999999), ContactRequestNotFoundError)
    await assert.rejects(() => service.unblockSender(999999), ContactRequestNotFoundError)
  })
})

test.group('ContactBlocklistService.senderStates', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const service = new ContactBlocklistService()

  test('aucune adresse → table vide ; adresse inconnue → ni blocage ni compte', async ({
    assert,
  }) => {
    const empty = await service.senderStates([], 1)
    assert.equal(empty.size, 0)

    const states = await service.senderStates(['Inconnu@exemple.test'], 1)

    assert.deepEqual(states.get('inconnu@exemple.test'), { senderBlocked: false, account: null })
  })

  test('signale l’adresse bloquée, sans casse', async ({ assert }) => {
    await BlockedContactEmailFactory.merge({ email: 'spam@exemple.test' }).create()

    const states = await service.senderStates(['SPAM@exemple.test', 'ok@exemple.test'], 1)

    assert.isTrue(states.get('spam@exemple.test')!.senderBlocked)
    assert.isFalse(states.get('ok@exemple.test')!.senderBlocked)
  })

  test('rapproche le compte qui porte l’adresse et dit s’il peut être désactivé', async ({
    assert,
  }) => {
    const actor = await createSuperAdmin()
    const advisor = await createAdvisor()
    const { user: particulier } = await createB2cCandidate()
    particulier.disabledAt = DateTime.now()
    await particulier.save()
    const expert = await createInHouseExpert()

    const states = await service.senderStates(
      [advisor.email.toUpperCase(), particulier.email, expert.email, actor.email],
      actor.id
    )

    assert.deepEqual(states.get(advisor.email.toLowerCase())!.account, {
      id: advisor.id,
      name: advisor.name,
      role: advisor.role,
      disabled: false,
      canDisable: true,
    })
    const b2c = states.get(particulier.email.toLowerCase())!.account!
    assert.isTrue(b2c.disabled)
    assert.isTrue(b2c.canDisable)
    assert.isFalse(states.get(expert.email.toLowerCase())!.account!.canDisable)
    assert.isFalse(states.get(actor.email.toLowerCase())!.account!.canDisable)
  })
})
