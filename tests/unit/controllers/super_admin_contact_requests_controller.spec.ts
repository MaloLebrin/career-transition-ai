import SuperAdminContactRequestsController from '#controllers/super_admin_contact_requests_controller'
import { BlockedContactEmailFactory } from '#database/factories/blocked_contact_email_factory'
import { ContactRequestFactory } from '#database/factories/contact_request_factory'
import BlockedContactEmail from '#models/blocked_contact_email'
import { ContactBlocklistService } from '#services/contact_blocklist_service'
import { ContactRequestsService } from '#services/contact_requests_service'
import { SuperAdminUsersService } from '#services/super_admin_users_service'
import { createAdvisor, createSuperAdmin } from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

function makeCtx(
  qs: Record<string, unknown> = {},
  body: Record<string, unknown> = {},
  actor: { id: number } = { id: 0 }
) {
  const flashes: Record<string, unknown> = {}
  const redirects: string[] = []
  return {
    request: { qs: () => qs, validateUsing: async () => body },
    inertia: {
      rendered: null as { name: string; props: any } | null,
      render(name: string, props: any) {
        this.rendered = { name, props }
        return this.rendered
      },
    },
    session: { flash: (key: string, value: unknown) => (flashes[key] = value) },
    response: { redirect: () => ({ back: () => redirects.push('back') }) },
    params: {} as Record<string, unknown>,
    auth: { getUserOrFail: () => actor },
    flashes,
    redirects,
  } as any
}

const controller = () =>
  new SuperAdminContactRequestsController(
    new ContactRequestsService({} as any),
    new ContactBlocklistService(),
    new SuperAdminUsersService({} as any)
  )

test.group('SuperAdminContactRequestsController (#73)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('index rend la page avec liste, pagination et filtres normalisés', async ({ assert }) => {
    await ContactRequestFactory.merge({ name: 'Zoé Contact' }).create()
    const ctx = makeCtx({ search: ' zoé ', status: 'bogus', type: 'demo' })

    await controller().index(ctx)

    assert.equal(ctx.inertia.rendered.name, 'dashboard/admin/contact_requests/Index')
    assert.deepEqual(ctx.inertia.rendered.props.filters, {
      search: 'zoé',
      status: 'all',
      type: 'demo',
    })
    assert.property(ctx.inertia.rendered.props, 'pagination')
  })

  test('updateStatus change le statut, flashe et revient en arrière', async ({ assert }) => {
    const request = await ContactRequestFactory.create()
    const ctx = makeCtx({}, { status: 'archived' })
    ctx.params = { id: String(request.id) }

    await controller().updateStatus(ctx)
    await request.refresh()

    assert.equal(request.status, 'archived')
    assert.equal(ctx.flashes.success, 'Demande mise à jour.')
    assert.deepEqual(ctx.redirects, ['back'])
  })

  test('blocked rend la liste des adresses bloquées ; unblockAddress lève le blocage par id', async ({
    assert,
  }) => {
    const blocked = await BlockedContactEmailFactory.merge({ email: 'spam@exemple.test' }).create()
    const ctx = makeCtx({ search: ' spam ' })

    await controller().blocked(ctx)

    assert.equal(ctx.inertia.rendered.name, 'dashboard/admin/contact_requests/Blocked')
    assert.deepEqual(ctx.inertia.rendered.props.filters, { search: 'spam' })
    assert.equal(ctx.inertia.rendered.props.blockedEmails[0].email, 'spam@exemple.test')

    ctx.params = { id: String(blocked.id) }
    await controller().unblockAddress(ctx)
    assert.equal(ctx.flashes.success, 'spam@exemple.test est débloquée.')
    assert.isNull(await BlockedContactEmail.find(blocked.id))

    await controller().unblockAddress(ctx)
    assert.equal(ctx.flashes.success, 'Cette adresse n’est plus bloquée.')
    assert.deepEqual(ctx.redirects, ['back', 'back'])
  })

  test('blockSender puis unblockSender : flash nommant l’adresse et retour en arrière', async ({
    assert,
  }) => {
    const actor = await createSuperAdmin()
    const request = await ContactRequestFactory.merge({ email: 'spam@exemple.test' }).create()
    const ctx = makeCtx({}, {}, actor)
    ctx.params = { id: String(request.id) }

    await controller().blockSender(ctx)

    assert.isNotNull(await BlockedContactEmail.findBy('email', 'spam@exemple.test'))
    assert.equal(
      ctx.flashes.success,
      'spam@exemple.test est bloquée : ses prochaines demandes seront ignorées.'
    )

    await controller().unblockSender(ctx)

    assert.isNull(await BlockedContactEmail.findBy('email', 'spam@exemple.test'))
    assert.equal(ctx.flashes.success, 'spam@exemple.test est débloquée.')
    assert.deepEqual(ctx.redirects, ['back', 'back'])
  })

  test('disableAccount puis enableAccount agissent sur le compte de l’adresse', async ({
    assert,
  }) => {
    const actor = await createSuperAdmin()
    const advisor = await createAdvisor()
    const request = await ContactRequestFactory.merge({ email: advisor.email }).create()
    const ctx = makeCtx({}, {}, actor)
    ctx.params = { id: String(request.id) }

    await controller().disableAccount(ctx)
    await advisor.refresh()
    assert.isNotNull(advisor.disabledAt)
    assert.equal(ctx.flashes.success, `Compte de ${advisor.name} désactivé.`)

    await controller().enableAccount(ctx)
    await advisor.refresh()
    assert.isNull(advisor.disabledAt)
    assert.equal(ctx.flashes.success, `Compte de ${advisor.name} réactivé.`)
  })
})
