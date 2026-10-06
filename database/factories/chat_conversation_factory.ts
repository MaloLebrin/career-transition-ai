import ChatConversation from '#models/chat_conversation'
import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'

/** Par défaut : conversation vide, dans la file (sans expert). État `withExpert` à compléter de `assignedExpertUserId`. */
export const ChatConversationFactory = factory
  .define(ChatConversation, () => {
    return {
      employeeId: 0, // à surcharger
      assignedExpertUserId: null as number | null,
      lastMessageAt: null as DateTime | null,
      candidateLastReadAt: null as DateTime | null,
      expertLastReadAt: null as DateTime | null,
    }
  })
  .state('active', (conversation) => {
    conversation.lastMessageAt = DateTime.now().minus({ minutes: 5 })
  })
  .build()
