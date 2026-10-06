import ExpertChatController from '#controllers/expert_chat_controller'
import type { ChatService } from '#services/chat_service'
import { test } from '@japa/runner'

function fakeService() {
  const calls: Record<string, unknown[]> = { list: [], page: [], send: [], claim: [], read: [] }
  return {
    calls,
    listForExpert: async (user: unknown) => {
      calls.list.push(user)
      return [{ id: 1 }]
    },
    expertPage: async (user: unknown, id: unknown, before: unknown) => {
      calls.page.push([user, id, before])
      return { conversation: { id }, messages: [], hasMore: false }
    },
    sendAsExpert: async (user: unknown, id: unknown, input: unknown) => {
      calls.send.push([user, id, input])
    },
    claim: async (user: unknown, id: unknown) => {
      calls.claim.push([user, id])
    },
    markReadAsExpert: async (user: unknown, id: unknown) => {
      calls.read.push([user, id])
    },
  } as unknown as ChatService & { calls: Record<string, unknown[]> }
}

function makeCtx(qs: Record<string, unknown> = {}) {
  const user = { id: 5 }
  const state = {
    back: 0,
    rendered: null as null | { page: string; props: unknown },
    flashes: [] as Array<[string, string]>,
  }
  const ctx = {
    auth: { getUserOrFail: () => user },
    params: { id: '12' },
    request: { qs: () => qs, validateUsing: async () => ({ body: 'Réponse' }) },
    session: { flash: (key: string, value: string) => state.flashes.push([key, value]) },
    response: { redirect: () => ({ back: () => void state.back++ }) },
    inertia: { render: (page: string, props: unknown) => (state.rendered = { page, props }) },
  } as any
  return { ctx, user, state }
}

test.group('ExpertChatController', () => {
  test('index rend la file', async ({ assert }) => {
    const service = fakeService()
    const { ctx, user, state } = makeCtx()

    await new ExpertChatController(service).index(ctx)

    assert.deepEqual(service.calls.list, [user])
    assert.equal(state.rendered?.page, 'dashboard/conseiller/chat/Index')
    assert.deepEqual(state.rendered?.props, { conversations: [{ id: 1 }] })
  })

  test('show rend la conversation avec id numérique et curseur', async ({ assert }) => {
    const service = fakeService()
    const { ctx, user, state } = makeCtx({ before: '30' })

    await new ExpertChatController(service).show(ctx)

    assert.deepEqual(service.calls.page, [[user, 12, 30]])
    assert.equal(state.rendered?.page, 'dashboard/conseiller/chat/Show')
  })

  test('store, claim et read délèguent puis redirigent en arrière', async ({ assert }) => {
    const service = fakeService()
    const controller = new ExpertChatController(service)
    const { ctx, user, state } = makeCtx()

    await controller.store(ctx)
    await controller.claim(ctx)
    await controller.read(ctx)

    assert.deepEqual(service.calls.send, [[user, 12, { body: 'Réponse' }]])
    assert.deepEqual(service.calls.claim, [[user, 12]])
    assert.deepEqual(service.calls.read, [[user, 12]])
    assert.equal(state.back, 3)
    assert.lengthOf(state.flashes, 1)
  })
})
