import type { ChatMessageView } from '#shared/types/chat/views'

/** Fusionne des messages par `id` (dédoublonnage) et les trie du plus ancien au plus récent. */
export function mergeChatMessages(
  current: readonly ChatMessageView[],
  incoming: readonly ChatMessageView[]
): ChatMessageView[] {
  const byId = new Map<number, ChatMessageView>()
  for (const message of current) byId.set(message.id, message)
  for (const message of incoming) byId.set(message.id, message)
  return [...byId.values()].sort((a, b) => a.id - b.id)
}

/** Données Transmit minimales d'un message valide (le canal n'est pas fiable à l'aveugle). */
export function isChatMessageView(data: unknown): data is ChatMessageView {
  if (typeof data !== 'object' || data === null) return false
  const m = data as Record<string, unknown>
  return (
    typeof m.id === 'number' &&
    typeof m.body === 'string' &&
    typeof m.createdAt === 'string' &&
    (m.authorRole === 'candidate' || m.authorRole === 'expert')
  )
}
