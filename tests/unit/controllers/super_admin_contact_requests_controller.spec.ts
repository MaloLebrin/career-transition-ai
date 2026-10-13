import SuperAdminContactRequestsController from '#controllers/super_admin_contact_requests_controller'
import { ContactRequestFactory } from '#database/factories/contact_request_factory'
import { ContactRequestsService } from '#services/contact_requests_service'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

function makeCtx(qs: Record<string, unknown> = {}, body: Record<string, unknown> = {}) {
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
    flashes,
    redirects,
  } as any
}

const controller = () =>
  new SuperAdminContactRequestsController(new ContactRequestsService({} as any))

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
})
