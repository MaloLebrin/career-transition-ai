import type { ChatAuthorRole } from '#shared/constants/chat'
import { isChatMessageView, mergeChatMessages } from '#shared/helpers/chat'
import type { ChatMessageView } from '#shared/types/chat/views'
import { Transmit } from '@adonisjs/transmit-client'
import { router } from '@inertiajs/react'
import { useCallback, useEffect, useRef, useState } from 'react'

interface UseChatConversationOptions {
  /** Canal Transmit de la conversation. */
  channel: string
  messages: ChatMessageView[]
  hasMore: boolean
  /** Rôle de l'utilisateur connecté : les messages de l'autre partie déclenchent le « lu ». */
  viewerRole: ChatAuthorRole
  /** URL du `POST …/read`. */
  readPath: string
}

/**
 * État d'une conversation en direct : messages des props fusionnés avec ceux reçus sur
 * Transmit (dédoublonnés par `id`), « lu » à l'ouverture et à chaque message de l'autre
 * partie, rattrapage par rechargement partiel à la reconnexion.
 */
export function useChatConversation({
  channel,
  messages: initialMessages,
  hasMore: initialHasMore,
  viewerRole,
  readPath,
}: UseChatConversationOptions) {
  const [messages, setMessages] = useState<ChatMessageView[]>(initialMessages)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loadingMore, setLoadingMore] = useState(false)
  const oldestRef = useRef<number | null>(initialMessages[0]?.id ?? null)

  const markRead = useCallback(() => {
    router.post(readPath, {}, { preserveScroll: true, preserveState: true, only: [] })
  }, [readPath])

  // Props rechargées (envoi, « charger plus », rattrapage) : fusion sans perdre l'état local.
  useEffect(() => {
    setMessages((prev) => mergeChatMessages(prev, initialMessages))
    const propsOldest = initialMessages[0]?.id ?? null
    // Seule une page au moins aussi ancienne que l'affichage renseigne `hasMore`.
    if (oldestRef.current === null || (propsOldest !== null && propsOldest <= oldestRef.current)) {
      setHasMore(initialHasMore)
    }
    if (propsOldest !== null && (oldestRef.current === null || propsOldest < oldestRef.current)) {
      oldestRef.current = propsOldest
    }
    setLoadingMore(false)
  }, [initialMessages, initialHasMore])

  useEffect(() => {
    markRead()
  }, [markRead])

  useEffect(() => {
    const transmit = new Transmit({ baseUrl: window.location.origin })
    const subscription = transmit.subscription(channel)
    let unsubscribe: (() => void) | null = null
    let cancelled = false
    let wasInterrupted = false
    const onReconnecting = () => {
      wasInterrupted = true
    }
    const onConnected = () => {
      if (!wasInterrupted) return
      wasInterrupted = false
      router.reload({ only: ['messages'] })
    }

    subscription
      .create()
      .then(() => {
        if (cancelled) return
        unsubscribe = subscription.onMessage((data: unknown) => {
          if (!isChatMessageView(data)) return
          setMessages((prev) => mergeChatMessages(prev, [data]))
          if (data.authorRole !== viewerRole) markRead()
        })
      })
      .catch(() => {})
    transmit.on('reconnecting', onReconnecting)
    transmit.on('connected', onConnected)

    return () => {
      cancelled = true
      if (unsubscribe) unsubscribe()
      subscription.delete().catch(() => {})
      transmit.off('reconnecting', onReconnecting)
      transmit.off('connected', onConnected)
    }
  }, [channel, viewerRole, markRead])

  const loadMore = useCallback(() => {
    const before = oldestRef.current
    if (before === null || loadingMore) return
    setLoadingMore(true)
    router.reload({
      only: ['messages', 'hasMore'],
      data: { before },
      onFinish: () => setLoadingMore(false),
    })
  }, [loadingMore])

  return { messages, hasMore, loadingMore, loadMore }
}
