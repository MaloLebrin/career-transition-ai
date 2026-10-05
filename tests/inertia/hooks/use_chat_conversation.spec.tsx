import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useChatConversation } from '../../../inertia/hooks/use_chat_conversation'
import { resetInertiaMock, routerSpies } from '../support/inertia_mock'
import { makeChatMessage } from '../support/factories'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../support/inertia_mock')
  return inertiaMock()
})

const transmit = vi.hoisted(() => ({
  channels: [] as string[],
  message: null as null | ((data: unknown) => void),
  handlers: {} as Record<string, () => void>,
  deleted: 0,
}))

vi.mock('@adonisjs/transmit-client', () => ({
  Transmit: vi.fn().mockImplementation(() => ({
    subscription: (channel: string) => {
      transmit.channels.push(channel)
      return {
        create: () => Promise.resolve(),
        delete: () => {
          transmit.deleted += 1
          return Promise.resolve()
        },
        onMessage: (handler: (data: unknown) => void) => {
          transmit.message = handler
          return () => {}
        },
      }
    },
    on: (event: string, cb: () => void) => {
      transmit.handlers[event] = cb
    },
    off: vi.fn(),
  })),
}))

const base = {
  channel: 'chat/conversations/4',
  hasMore: false,
  viewerRole: 'candidate' as const,
  readPath: '/dashboard/candidat/chat/read',
}

async function mount(messages = [makeChatMessage({ id: 1 })], extra = {}) {
  const hook = renderHook((props) => useChatConversation(props), {
    initialProps: { ...base, messages, ...extra },
  })
  await act(async () => {})
  return hook
}

describe('useChatConversation', () => {
  beforeEach(() => {
    resetInertiaMock()
    transmit.channels.length = 0
    transmit.message = null
    transmit.handlers = {}
    transmit.deleted = 0
  })

  test('s’abonne au canal et marque la conversation lue à l’ouverture', async () => {
    await mount()
    expect(transmit.channels).toEqual(['chat/conversations/4'])
    expect(routerSpies.post).toHaveBeenCalledWith(
      '/dashboard/candidat/chat/read',
      {},
      expect.objectContaining({ preserveScroll: true, only: [] })
    )
  })

  test('ajoute les messages entrants sans doublon et marque lu pour l’autre partie', async () => {
    const { result } = await mount()
    routerSpies.post.mockClear()

    act(() => transmit.message?.(makeChatMessage({ id: 2, authorRole: 'expert' })))
    act(() => transmit.message?.(makeChatMessage({ id: 2, authorRole: 'expert' })))

    expect(result.current.messages.map((m) => m.id)).toEqual([1, 2])
    expect(routerSpies.post).toHaveBeenCalledTimes(2)
  })

  test('ne marque pas lu à la réception de son propre message', async () => {
    const { result } = await mount()
    routerSpies.post.mockClear()

    act(() => transmit.message?.(makeChatMessage({ id: 2, authorRole: 'candidate' })))

    expect(result.current.messages).toHaveLength(2)
    expect(routerSpies.post).not.toHaveBeenCalled()
  })

  test('ignore une charge Transmit invalide', async () => {
    const { result } = await mount()
    act(() => transmit.message?.({ foo: 'bar' }))
    expect(result.current.messages).toHaveLength(1)
  })

  test('recharge les messages après une reconnexion', async () => {
    await mount()
    act(() => transmit.handlers.reconnecting?.())
    act(() => transmit.handlers.connected?.())
    expect(routerSpies.reload).toHaveBeenCalledWith({ only: ['messages'] })
  })

  test('ne recharge pas à la première connexion', async () => {
    await mount()
    act(() => transmit.handlers.connected?.())
    expect(routerSpies.reload).not.toHaveBeenCalled()
  })

  test('loadMore recharge avec le curseur before et fusionne les anciens messages', async () => {
    const { result, rerender } = await mount([makeChatMessage({ id: 5 })], { hasMore: true })

    act(() => result.current.loadMore())
    expect(routerSpies.reload).toHaveBeenCalledWith(
      expect.objectContaining({ only: ['messages', 'hasMore'], data: { before: 5 } })
    )

    rerender({
      ...base,
      messages: [makeChatMessage({ id: 3 }), makeChatMessage({ id: 4 })],
      hasMore: false,
    })
    expect(result.current.messages.map((m) => m.id)).toEqual([3, 4, 5])
    expect(result.current.hasMore).toBe(false)
  })

  test('un rechargement de la dernière page ne rouvre pas « charger plus » après avoir tout chargé', async () => {
    const { result, rerender } = await mount([makeChatMessage({ id: 3 })], { hasMore: true })

    rerender({ ...base, messages: [makeChatMessage({ id: 1 })], hasMore: false })
    expect(result.current.hasMore).toBe(false)

    rerender({
      ...base,
      messages: [makeChatMessage({ id: 3 }), makeChatMessage({ id: 4 })],
      hasMore: true,
    })
    expect(result.current.hasMore).toBe(false)
    expect(result.current.messages.map((m) => m.id)).toEqual([1, 3, 4])
  })

  test('se désabonne au démontage', async () => {
    const { unmount } = await mount()
    unmount()
    expect(transmit.deleted).toBe(1)
  })
})
