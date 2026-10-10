/**
 * Chat candidat ↔ expert : une conversation par candidat, avec l'équipe
 * d'experts de la plateforme (file d'attente) puis avec l'expert assigné.
 * Les valeurs alimentent la contrainte CHECK de `chat_messages.author_role`.
 */
export const CHAT_AUTHOR_ROLES = {
  CANDIDATE: 'candidate',
  EXPERT: 'expert',
} as const

export type ChatAuthorRole = (typeof CHAT_AUTHOR_ROLES)[keyof typeof CHAT_AUTHOR_ROLES]

export const chatAuthorRoleValues = Object.values(CHAT_AUTHOR_ROLES)

/** Longueur maximale d'un message (validator, champ et colonne). */
export const CHAT_MESSAGE_MAX = 2000

/** Messages renvoyés par page (les plus récents, puis curseur `before`). */
export const CHAT_PAGE_SIZE = 30

/** Longueur de l'aperçu du dernier message dans la file de l'expert. */
export const CHAT_PREVIEW_MAX = 120

/** Rapport d'une conversation à l'expert connecté, dans sa file. */
export const CHAT_ASSIGNMENTS = {
  /** Conversation de l'expert connecté (assigné ou pris en charge). */
  ME: 'me',
  /** Pas encore d'expert : n'importe quel expert peut la prendre. */
  QUEUE: 'queue',
  /** Prise par un autre expert (visible des seuls administrateurs). */
  OTHER: 'other',
} as const

export type ChatAssignment = (typeof CHAT_ASSIGNMENTS)[keyof typeof CHAT_ASSIGNMENTS]

/** Canal Transmit d'une conversation (`start/transmit.ts`). */
export const CHAT_CHANNEL_PATTERN = 'chat/conversations/:id'
export const chatChannel = (conversationId: number) => `chat/conversations/${conversationId}`

/** Pages et actions du chat. `before` : curseur de pagination (id du plus ancien message affiché). */
export const CHAT_PATHS = {
  candidate: '/dashboard/candidat/chat',
  candidateMessages: '/dashboard/candidat/chat/messages',
  candidateRead: '/dashboard/candidat/chat/read',
  expert: '/dashboard/conseiller/chat',
  expertShow: (id: number) => `/dashboard/conseiller/chat/${id}`,
  expertMessages: (id: number) => `/dashboard/conseiller/chat/${id}/messages`,
  expertClaim: (id: number) => `/dashboard/conseiller/chat/${id}/claim`,
  expertRead: (id: number) => `/dashboard/conseiller/chat/${id}/read`,
} as const
