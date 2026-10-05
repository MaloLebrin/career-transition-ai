import type { AccountType } from '#shared/constants/b2c'
import type { ChatAssignment, ChatAuthorRole } from '#shared/constants/chat'

/** Message tel qu'affiché et diffusé sur Transmit (jamais de nom). */
export interface ChatMessageView {
  id: number
  authorRole: ChatAuthorRole
  body: string
  createdAt: string
}

/** Conversation vue par le candidat. */
export interface ChatConversationView {
  id: number
  /** Canal Transmit à souscrire. */
  channel: string
  /** Expert assigné (nom seul), `null` tant que la conversation est dans la file. */
  expert: { name: string } | null
  lastMessageAt: string | null
  /** Messages de l'expert non lus par le candidat. */
  unreadCount: number
}

/** Conversation vue par l'équipe d'experts (id du candidat seulement, jamais son nom). */
export interface ChatConversationSummary {
  id: number
  channel: string
  employeeId: number
  /** `Candidat #<id>`. */
  candidateLabel: string
  accountType: AccountType
  assignment: ChatAssignment
  lastMessageAt: string | null
  /** Début du dernier message, `null` si la conversation est vide. */
  lastMessagePreview: string | null
  /** Messages du candidat non lus par l'équipe. */
  unreadCount: number
}

/** Une page de messages, du plus ancien au plus récent. */
export interface ChatMessagesPage {
  messages: ChatMessageView[]
  /** Des messages plus anciens existent : repasser `?before=<id du premier message>`. */
  hasMore: boolean
}

/** Props de `dashboard/candidat/chat/Index`. */
export interface CandidateChatPageProps extends ChatMessagesPage {
  conversation: ChatConversationView
}

/** Props de `dashboard/conseiller/chat/Index`. */
export interface ExpertChatIndexPageProps {
  conversations: ChatConversationSummary[]
}

/** Props de `dashboard/conseiller/chat/Show`. */
export interface ExpertChatShowPageProps extends ChatMessagesPage {
  conversation: ChatConversationSummary
}
