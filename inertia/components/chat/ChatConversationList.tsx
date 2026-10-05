import { CHAT_ASSIGNMENTS, CHAT_PATHS, type ChatAssignment } from '#shared/constants/chat'
import { formatRelativeTime } from '#shared/helpers/date'
import type { ChatConversationSummary } from '#shared/types/chat/views'
import AppLink from '~/components/ui/AppLink'
import Badge from '~/components/ui/Badge'

interface ChatConversationListProps {
  conversations: ChatConversationSummary[]
}

const ASSIGNMENT_BADGES: Record<
  ChatAssignment,
  { label: string; tone: 'sun' | 'success' | 'neutral' }
> = {
  [CHAT_ASSIGNMENTS.QUEUE]: { label: 'File d’attente', tone: 'sun' },
  [CHAT_ASSIGNMENTS.ME]: { label: 'Mes conversations', tone: 'success' },
  [CHAT_ASSIGNMENTS.OTHER]: { label: 'Autre expert', tone: 'neutral' },
}

/** Liste des conversations de l'équipe d'experts, avec badge de messages non lus. */
export function ChatConversationList({ conversations }: ChatConversationListProps) {
  if (conversations.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted">Aucune conversation pour le moment.</p>
    )
  }

  return (
    <ul className="divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline bg-surface">
      {conversations.map((conversation) => {
        const badge = ASSIGNMENT_BADGES[conversation.assignment]
        return (
          <li key={conversation.id}>
            <AppLink
              href={CHAT_PATHS.expertShow(conversation.id)}
              className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface-soft"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-ink">{conversation.candidateLabel}</span>
                  <Badge variant={badge.tone}>{badge.label}</Badge>
                </div>
                <p className="truncate text-sm text-ink-soft">
                  {conversation.lastMessagePreview ?? 'Aucun message'}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {conversation.lastMessageAt && (
                  <span className="text-xs text-muted">
                    {formatRelativeTime(conversation.lastMessageAt)}
                  </span>
                )}
                {conversation.unreadCount > 0 && (
                  <Badge variant="primary" aria-label={`${conversation.unreadCount} non lus`}>
                    {conversation.unreadCount}
                  </Badge>
                )}
              </div>
            </AppLink>
          </li>
        )
      })}
    </ul>
  )
}
