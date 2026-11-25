import { ContactRequestFactory } from '#database/factories/contact_request_factory'
import BlockedContactEmail from '#models/blocked_contact_email'
import ContactRequest from '#models/contact_request'
import { CONTACT_REQUEST_STATUSES } from '#shared/constants/contact_request'
import { SUPER_ADMIN_PATHS } from '#shared/constants/super_admin'
import {
  createAdvisor,
  createB2cCandidate,
  createInHouseExpert,
  createSuperAdmin,
} from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * Blocage d'un expéditeur depuis la boîte des demandes de contact du super admin :
 * POST /dashboard/super-admin/contact-requests/:id/{block-sender,unblock-sender,
 * disable-account,enable-account}.
 */
test.group('Super admin — demandes de contact : blocage de l’expéditeur', (group) => {
  group.each.setup(() => truncateDb())

  test('bloquer puis débloquer l’adresse : flash, archivage et état dans la liste', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const request = await ContactRequestFactory.merge({ email: 'Spam@Exemple.test' }).create()

    const blocked = await client
      .post(SUPER_ADMIN_PATHS.contactRequestBlockSender(request.id))
      .loginAs(superAdmin)
      .withInertia()
      .header('referer', SUPER_ADMIN_PATHS.contactRequests)
      .redirects(0)

    blocked.assertStatus(302)
    blocked.assertHeader('location', SUPER_ADMIN_PATHS.contactRequests)
    assert.equal(
      blocked.flashMessage('success'),
      'Spam@Exemple.test est bloquée : ses prochaines demandes seront ignorées.'
    )
    const row = await BlockedContactEmail.findByOrFail('email', 'spam@exemple.test')
    assert.equal(row.blockedByUserId, superAdmin.id)
    await request.refresh()
    assert.equal(request.status, CONTACT_REQUEST_STATUSES.ARCHIVED)

    const list = await client
      .get(SUPER_ADMIN_PATHS.contactRequests)
      .loginAs(superAdmin)
      .withInertia()
    const props = assertPage(assert, list, 'dashboard/admin/contact_requests/Index', ['requests'])
    const [item] = props.requests as Array<{ senderBlocked: boolean; account: unknown }>
    assert.isTrue(item.senderBlocked)
    assert.isNull(item.account)

    const unblocked = await client
      .post(SUPER_ADMIN_PATHS.contactRequestUnblockSender(request.id))
      .loginAs(superAdmin)
      .withInertia()
      .redirects(0)

    unblocked.assertStatus(302)
    assert.isNull(await BlockedContactEmail.findBy('email', 'spam@exemple.test'))
  })

  test('une adresse bloquée ne passe plus par le formulaire public', async ({ client, assert }) => {
    const superAdmin = await createSuperAdmin()
    const request = await ContactRequestFactory.merge({ email: 'spam@exemple.test' }).create()
    await client
      .post(SUPER_ADMIN_PATHS.contactRequestBlockSender(request.id))
      .loginAs(superAdmin)
      .withInertia()
      .redirects(0)

    const response = await client
      .post('/contact-requests')
      .withInertia()
      .header('referer', '/contact')
      .json({
        name: 'Encore Lui',
        email: 'spam@exemple.test',
        message: 'Un nouveau message publicitaire non sollicité.',
        type: 'contact',
      })
      .redirects(0)

    response.assertStatus(302)
    assert.equal(response.flashMessage('success'), 'Votre message a bien été envoyé.')
    assert.lengthOf(await ContactRequest.all(), 1)
  })

  test('désactiver puis réactiver le compte d’un particulier depuis sa demande', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const { user } = await createB2cCandidate()
    const request = await ContactRequestFactory.merge({ email: user.email }).create()

    const list = await client
      .get(SUPER_ADMIN_PATHS.contactRequests)
      .loginAs(superAdmin)
      .withInertia()
    const props = assertPage(assert, list, 'dashboard/admin/contact_requests/Index', ['requests'])
    const [item] = props.requests as Array<{
      account: { id: number; disabled: boolean; canDisable: boolean } | null
    }>
    assert.deepInclude(item.account, { id: user.id, disabled: false, canDisable: true })

    const disabled = await client
      .post(SUPER_ADMIN_PATHS.contactRequestDisableAccount(request.id))
      .loginAs(superAdmin)
      .withInertia()
      .redirects(0)

    disabled.assertStatus(302)
    assert.equal(disabled.flashMessage('success'), `Compte de ${user.name} désactivé.`)
    await user.refresh()
    assert.isNotNull(user.disabledAt)

    const enabled = await client
      .post(SUPER_ADMIN_PATHS.contactRequestEnableAccount(request.id))
      .loginAs(superAdmin)
      .withInertia()
      .redirects(0)

    enabled.assertStatus(302)
    await user.refresh()
    assert.isNull(user.disabledAt)
  })

  test('aucun compte, équipe plateforme (soi-même compris) ou demande inconnue → 404', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const expert = await createInHouseExpert()
    const anonymous = await ContactRequestFactory.merge({ email: 'anonyme@exemple.test' }).create()
    const fromExpert = await ContactRequestFactory.merge({ email: expert.email }).create()
    const fromSelf = await ContactRequestFactory.merge({ email: superAdmin.email }).create()
    const post = (path: string) =>
      client.post(path).loginAs(superAdmin).header('Accept', 'application/json')

    const noAccount = await post(SUPER_ADMIN_PATHS.contactRequestDisableAccount(anonymous.id))
    const platformTeam = await post(SUPER_ADMIN_PATHS.contactRequestDisableAccount(fromExpert.id))
    const unknownRequest = await post(SUPER_ADMIN_PATHS.contactRequestBlockSender(999999))
    const self = await post(SUPER_ADMIN_PATHS.contactRequestDisableAccount(fromSelf.id))

    noAccount.assertStatus(404)
    platformTeam.assertStatus(404)
    unknownRequest.assertStatus(404)
    self.assertStatus(404)
    await Promise.all([expert.refresh(), superAdmin.refresh()])
    assert.isNull(expert.disabledAt)
    assert.isNull(superAdmin.disabledAt)
  })

  test('réservé au super admin (403 pour un conseiller)', async ({ client, assert }) => {
    const advisor = await createAdvisor()
    const request = await ContactRequestFactory.create()

    for (const path of [
      SUPER_ADMIN_PATHS.contactRequestBlockSender(request.id),
      SUPER_ADMIN_PATHS.contactRequestUnblockSender(request.id),
      SUPER_ADMIN_PATHS.contactRequestDisableAccount(request.id),
      SUPER_ADMIN_PATHS.contactRequestEnableAccount(request.id),
    ]) {
      const response = await client.post(path).loginAs(advisor).header('Accept', 'application/json')
      response.assertStatus(403)
    }
    assert.lengthOf(await BlockedContactEmail.all(), 0)
  })
})
