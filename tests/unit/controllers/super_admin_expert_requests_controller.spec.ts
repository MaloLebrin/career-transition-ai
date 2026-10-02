import SuperAdminExpertRequestsController, {
  EXPERT_ASSIGNED_MESSAGE,
  EXPERT_REQUEST_DECLINED_MESSAGE,
  TEAM_MEMBER_INVITED_MESSAGE,
} from '#controllers/super_admin_expert_requests_controller'
import type { ExpertRequestsService } from '#services/expert_requests_service'
import type { PlatformTeamService } from '#services/platform_team_service'
import { EXPERT_REQUEST_PATHS } from '#shared/constants/expert_request'
import { test } from '@japa/runner'

/** Contrôleur fin (#105) : tout passe par les services, remplacés par des faux. */
function fakes() {
  const calls: Record<string, unknown[]> = { assign: [], decline: [], invite: [] }
  const requests = {
    listForAdmin: async () => [{ id: 1 }],
    assign: async (actor: unknown, input: unknown) => {
      calls.assign.push([actor, input])
      return { id: 1 }
    },
    decline: async (actor: unknown, input: unknown) => {
      calls.decline.push([actor, input])
      return { id: 1 }
    },
  } as unknown as ExpertRequestsService
  const team = {
    listMembers: async () => [{ id: 7 }],
    invite: async (input: unknown) => {
      calls.invite.push(input)
      return { id: 9 }
    },
  } as unknown as PlatformTeamService
  return { calls, requests, team }
}

function makeCtx(validated: Record<string, unknown> = {}, params: Record<string, string> = {}) {
  const user = { id: 42 }
  const flashes: Array<[string, string]> = []
  const state = { redirectedTo: '', rendered: null as null | { page: string; props: unknown } }
  const ctx = {
    auth: { getUserOrFail: () => user },
    params,
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

test.group('SuperAdminExpertRequestsController (#105)', () => {
  test('index et team rendent les pages avec les listes des services', async ({ assert }) => {
    const { requests, team } = fakes()
    const controller = new SuperAdminExpertRequestsController(requests, team)

    const index = makeCtx()
    await controller.index(index.ctx)
    assert.equal(index.state.rendered?.page, 'dashboard/admin/expert_requests/Index')
    assert.deepEqual(index.state.rendered?.props, { requests: [{ id: 1 }], experts: [{ id: 7 }] })

    const teamPage = makeCtx()
    await controller.team(teamPage.ctx)
    assert.equal(teamPage.state.rendered?.page, 'dashboard/admin/team/Index')
    assert.deepEqual(teamPage.state.rendered?.props, { members: [{ id: 7 }] })
  })

  test('assign et decline : validation, service avec l’acteur, flash, redirection', async ({
    assert,
  }) => {
    const { requests, team, calls } = fakes()
    const controller = new SuperAdminExpertRequestsController(requests, team)

    const assign = makeCtx({ expertUserId: 7 }, { id: '3' })
    await controller.assign(assign.ctx)
    assert.deepEqual(calls.assign, [[assign.user, { requestId: 3, expertUserId: 7 }]])
    assert.deepEqual(assign.flashes, [['success', EXPERT_ASSIGNED_MESSAGE]])
    assert.equal(assign.state.redirectedTo, EXPERT_REQUEST_PATHS.admin)

    const decline = makeCtx({ reason: 'Pas de disponibilité.' }, { id: '4' })
    await controller.decline(decline.ctx)
    assert.deepEqual(calls.decline, [
      [decline.user, { requestId: 4, reason: 'Pas de disponibilité.' }],
    ])
    assert.deepEqual(decline.flashes, [['success', EXPERT_REQUEST_DECLINED_MESSAGE]])
  })

  test('invite : service puis redirection vers l’équipe', async ({ assert }) => {
    const { requests, team, calls } = fakes()
    const payload = { name: 'Nadia', email: 'nadia@plateforme.test', role: 'advisor' }
    const invite = makeCtx(payload)

    await new SuperAdminExpertRequestsController(requests, team).invite(invite.ctx)

    assert.deepEqual(calls.invite, [payload])
    assert.deepEqual(invite.flashes, [['success', TEAM_MEMBER_INVITED_MESSAGE]])
    assert.equal(invite.state.redirectedTo, EXPERT_REQUEST_PATHS.team)
  })
})
