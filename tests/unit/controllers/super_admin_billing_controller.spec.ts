import SuperAdminBillingController, {
  ACCESS_GRANTED_MESSAGE,
  ACCESS_REVOKED_MESSAGE,
} from '#controllers/super_admin_billing_controller'
import type { SuperAdminB2cService } from '#services/super_admin_b2c_service'
import type { SuperAdminPaymentsService } from '#services/super_admin_payments_service'
import { BILLING_ADMIN_PATHS } from '#shared/constants/billing'
import { test } from '@japa/runner'

/** Contrôleur fin (#107) : tout passe par les services, remplacés par des faux. */
function fakes() {
  const calls: Record<string, unknown[]> = { grant: [], revoke: [], list: [] }
  const b2c = {
    listCandidates: async () => [{ id: 1 }],
    stats: async () => ({ candidates: 1 }),
  } as unknown as SuperAdminB2cService
  const payments = {
    parseFilter: (raw: Record<string, unknown>) => ({ status: raw.status ?? null, page: 1 }),
    list: async (filter: unknown) => {
      calls.list.push(filter)
      return { items: [], filter, total: 0, lastPage: 1 }
    },
    grant: async (actor: unknown, employeeId: number) => {
      calls.grant.push([actor, employeeId])
      return { id: 9 }
    },
    revoke: async (actor: unknown, input: unknown) => {
      calls.revoke.push([actor, input])
      return { id: 9 }
    },
  } as unknown as SuperAdminPaymentsService
  return { calls, b2c, payments }
}

function makeCtx(
  validated: Record<string, unknown> = {},
  params: Record<string, string> = {},
  qs = {}
) {
  const user = { id: 42 }
  const flashes: Array<[string, string]> = []
  const state = {
    redirectedTo: '',
    back: false,
    rendered: null as null | { page: string; props: unknown },
  }
  const ctx = {
    auth: { getUserOrFail: () => user },
    params,
    request: { validateUsing: async () => validated, qs: () => qs },
    session: { flash: (key: string, value: string) => flashes.push([key, value]) },
    response: {
      redirect: (url?: string) => {
        if (url) state.redirectedTo = url
        return {
          back: () => {
            state.back = true
          },
        }
      },
    },
    inertia: {
      render: (page: string, props: unknown) => {
        state.rendered = { page, props }
        return state.rendered
      },
    },
  } as any
  return { ctx, user, flashes, state }
}

test.group('SuperAdminBillingController (#107)', () => {
  test('candidates et index rendent les pages avec les données des services', async ({
    assert,
  }) => {
    const { b2c, payments, calls } = fakes()
    const controller = new SuperAdminBillingController(b2c, payments)

    const candidates = makeCtx()
    await controller.candidates(candidates.ctx)
    assert.equal(candidates.state.rendered?.page, 'dashboard/admin/b2c/Index')
    assert.deepEqual(candidates.state.rendered?.props, {
      candidates: [{ id: 1 }],
      stats: { candidates: 1 },
    })

    const index = makeCtx({}, {}, { status: 'paid' })
    await controller.index(index.ctx)
    assert.equal(index.state.rendered?.page, 'dashboard/admin/payments/Index')
    assert.deepEqual(calls.list, [{ status: 'paid', page: 1 }])
  })

  test('grant et revoke : service avec l’acteur, flash, redirection', async ({ assert }) => {
    const { b2c, payments, calls } = fakes()
    const controller = new SuperAdminBillingController(b2c, payments)

    const grant = makeCtx({}, { employeeId: '7' })
    await controller.grant(grant.ctx)
    assert.deepEqual(calls.grant, [[grant.user, 7]])
    assert.deepEqual(grant.flashes, [['success', ACCESS_GRANTED_MESSAGE]])
    assert.equal(grant.state.redirectedTo, BILLING_ADMIN_PATHS.b2c)

    const revoke = makeCtx({ reason: 'Litige en cours.' }, { id: '3' })
    await controller.revoke(revoke.ctx)
    assert.deepEqual(calls.revoke, [[revoke.user, { paymentId: 3, reason: 'Litige en cours.' }]])
    assert.deepEqual(revoke.flashes, [['success', ACCESS_REVOKED_MESSAGE]])
    assert.isTrue(revoke.state.back)
  })
})
