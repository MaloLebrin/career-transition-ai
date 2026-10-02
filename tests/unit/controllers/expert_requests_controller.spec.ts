import ExpertRequestsController, {
  EXPERT_REQUEST_SENT_MESSAGE,
} from '#controllers/expert_requests_controller'
import type { ExpertRequestsService } from '#services/expert_requests_service'
import { EXPERT_REQUEST_PATHS } from '#shared/constants/expert_request'
import { test } from '@japa/runner'

/** Contrôleur fin (#103) : tout passe par `ExpertRequestsService`, remplacé par un faux. */
function fakeService() {
  const calls: Record<string, unknown[]> = { supportViewFor: [], createForUser: [] }
  const support = { eligible: true, lockedReason: null, request: null, expert: null }
  return {
    calls,
    supportViewFor: async (user: unknown) => {
      calls.supportViewFor.push(user)
      return support
    },
    createForUser: async (user: unknown, input: unknown) => {
      calls.createForUser.push([user, input])
      return { id: 1 }
    },
  } as unknown as ExpertRequestsService & { calls: Record<string, unknown[]> }
}

function makeCtx(validated: Record<string, unknown> = {}) {
  const user = { id: 7 }
  const flashes: Array<[string, string]> = []
  const state = { redirectedTo: '', rendered: null as null | { page: string; props: unknown } }
  const ctx = {
    auth: { getUserOrFail: () => user },
    request: { validateUsing: async () => validated },
    session: { flash: (key: string, value: string) => flashes.push([key, value]) },
    response: {
      redirect: (url: string) => {
        state.redirectedTo = url
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

test.group('ExpertRequestsController (#103)', () => {
  test('index rend la page avec la vue du service', async ({ assert }) => {
    const service = fakeService()
    const { ctx, user, state } = makeCtx()

    await new ExpertRequestsController(service).index(ctx)

    assert.deepEqual(service.calls.supportViewFor, [user])
    assert.equal(state.rendered?.page, 'dashboard/candidat/expert/Index')
    assert.deepEqual(state.rendered?.props, {
      support: { eligible: true, lockedReason: null, request: null, expert: null },
    })
  })

  test('store valide, crée puis redirige vers la page avec un flash', async ({ assert }) => {
    const service = fakeService()
    const payload = { message: 'Un message suffisamment long.', availability: 'Mardi' }
    const { ctx, user, state, flashes } = makeCtx(payload)

    await new ExpertRequestsController(service).store(ctx)

    assert.deepEqual(service.calls.createForUser, [[user, payload]])
    assert.equal(state.redirectedTo, EXPERT_REQUEST_PATHS.page)
    assert.deepEqual(flashes, [['success', EXPERT_REQUEST_SENT_MESSAGE]])
  })
})
