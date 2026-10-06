import { describe, expect, test } from 'vitest'
import { isChatMessageView, mergeChatMessages } from '#shared/helpers/chat'
import type { ChatMessageView } from '#shared/types/chat/views'

const msg = (id: number, body = `m${id}`): ChatMessageView => ({
  id,
  authorRole: 'candidate',
  body,
  createdAt: '2026-10-05T10:00:00.000Z',
})

describe('mergeChatMessages', () => {
  test('dédoublonne par id et trie du plus ancien au plus récent', () => {
    const merged = mergeChatMessages([msg(3), msg(4)], [msg(2), msg(4, 'maj'), msg(5)])
    expect(merged.map((m) => m.id)).toEqual([2, 3, 4, 5])
    expect(merged.find((m) => m.id === 4)?.body).toBe('maj')
  })
})

describe('isChatMessageView', () => {
  test('accepte un message valide', () => {
    expect(isChatMessageView(msg(1))).toBe(true)
  })

  test('refuse les charges inattendues', () => {
    expect(isChatMessageView(null)).toBe(false)
    expect(isChatMessageView({ id: '1' })).toBe(false)
    expect(isChatMessageView({ ...msg(1), authorRole: 'admin' })).toBe(false)
  })
})
