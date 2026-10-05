import { CHAT_AUTHOR_ROLES, type ChatAuthorRole } from '#shared/constants/chat'
import { formatRelativeTime } from '#shared/helpers/date'
import type { ChatMessageView } from '#shared/types/chat/views'

interface ChatMessageBubbleProps {
  message: ChatMessageView
  /** Rôle de l'utilisateur connecté : ses messages sont à droite. */
  viewerRole: ChatAuthorRole
}

/** Bulle d'un message ; le corps est du texte brut (retours à la ligne conservés). */
export function ChatMessageBubble({ message, viewerRole }: ChatMessageBubbleProps) {
  const mine = message.authorRole === viewerRole
  const authorLabel = message.authorRole === CHAT_AUTHOR_ROLES.EXPERT ? 'Expert' : 'Candidat'

  return (
    <li className={`flex ${mine ? 'justify-end' : 'justify-start'}`} data-mine={mine}>
      <div
        className={`max-w-[85%] space-y-1 rounded-2xl px-4 py-2.5 sm:max-w-[70%] ${
          mine ? 'bg-primary text-on-ink' : 'border border-hairline bg-surface-soft text-ink'
        }`}
      >
        <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
        <p className={`text-xs ${mine ? 'text-on-ink-soft' : 'text-muted'}`}>
          {mine ? 'Vous' : authorLabel} · {formatRelativeTime(message.createdAt)}
        </p>
      </div>
    </li>
  )
}
