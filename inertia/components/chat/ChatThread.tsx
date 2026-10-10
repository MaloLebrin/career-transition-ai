import type { ChatAuthorRole } from '#shared/constants/chat'
import type { ChatMessageView } from '#shared/types/chat/views'
import { useEffect, useRef } from 'react'
import Button from '~/components/ui/Button'
import { ChatMessageBubble } from './ChatMessageBubble'

interface ChatThreadProps {
  messages: ChatMessageView[]
  viewerRole: ChatAuthorRole
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
}

/** Fil de messages : défile en bas à chaque nouveau message, « charger plus » en haut. */
export function ChatThread({
  messages,
  viewerRole,
  hasMore,
  loadingMore,
  onLoadMore,
}: ChatThreadProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const lastIdRef = useRef<number | null>(null)

  const lastId = messages.at(-1)?.id ?? null
  useEffect(() => {
    // Seulement quand le plus récent change : charger des messages anciens ne doit pas sauter en bas.
    if (lastId !== lastIdRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
    lastIdRef.current = lastId
  }, [lastId])

  return (
    <div
      ref={containerRef}
      className="h-[55vh] min-h-64 space-y-3 overflow-y-auto rounded-2xl border border-hairline bg-canvas p-4"
      aria-label="Messages"
      role="log"
      aria-live="polite"
    >
      {hasMore && (
        <div className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? 'Chargement…' : 'Charger les messages précédents'}
          </Button>
        </div>
      )}
      {messages.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">
          Aucun message pour le moment. Écrivez le premier.
        </p>
      ) : (
        <ul className="space-y-3">
          {messages.map((message) => (
            <ChatMessageBubble key={message.id} message={message} viewerRole={viewerRole} />
          ))}
        </ul>
      )}
    </div>
  )
}
