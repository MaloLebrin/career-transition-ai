import ChatController from '#controllers/chat_controller'
import type { ChatService } from '#services/chat_service'
import { test } from '@japa/runner'

function fakeService() {
  const calls: Record<string, unknown[]> = { page: [], send: [], read: [] }
  return {
    calls,
    candidatePage: async (user: unknown, before: unknown) => {
      calls.page.push([user, before])
      return { conversation: { id: 1 }, messages: [], hasMore: false }
    },
    sendAsCandidate: async (user: unknown, input: unknown) => {
      calls.send.push([user, input])
    },
    markReadAsCandidate: async (user: unknown) => {
      calls.read.push(user)
    },
  } as unknown as ChatService & { calls: Record<string, unknown[]> }
}

function makeCtx(qs: Record<string, unknown> = {}, validated: unknown = { body: 'Salut' }) {
  const user = { id: 3 }
  const state = { back: 0, rendered: null as null | { page: string; props: unknown } }
  const ctx = {
    auth: { getUserOrFail: () => user },
    request: { qs: () => qs, validateUsing: async () => validated },
    response: { redirect: () => ({ back: () => void state.back++ }) },
    inertia: {
      render: (page: string, props: unknown) => (state.rendered = { page, props }),
    },
  } as any
  return { ctx, user, state }
}

test.group('ChatController (candidat)', () => {
  test('show rend la page avec la vue du service et le curseur', async ({ assert }) => {
    const service = fakeService()
    const { ctx, user, state } = makeCtx({ before: '9' })

    await new ChatController(service).show(ctx)

    assert.deepEqual(service.calls.page, [[user, 9]])
    assert.equal(state.rendered?.page, 'dashboard/candidat/chat/Index')
    assert.deepEqual(state.rendered?.props, {
      conversation: { id: 1 },
      messages: [],
      hasMore: false,
    })
  })

  test('store envoie puis redirige en arrière', async ({ assert }) => {
    const service = fakeService()
    const { ctx, user, state } = makeCtx()

    await new ChatController(service).store(ctx)

    assert.deepEqual(service.calls.send, [[user, { body: 'Salut' }]])
    assert.equal(state.back, 1)
  })

  test('read marque lu puis redirige en arrière', async ({ assert }) => {
    const service = fakeService()
    const { ctx, user, state } = makeCtx()

    await new ChatController(service).read(ctx)

    assert.deepEqual(service.calls.read, [user])
    assert.equal(state.back, 1)
  })
})
