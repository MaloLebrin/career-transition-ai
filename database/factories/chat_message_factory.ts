import ChatMessage from '#models/chat_message'
import { CHAT_AUTHOR_ROLES } from '#shared/constants/chat'
import factory from '@adonisjs/lucid/factories'

/** Par défaut : message du candidat. État `fromExpert` pour la réponse. */
export const ChatMessageFactory = factory
  .define(ChatMessage, ({ faker }) => {
    return {
      conversationId: 0, // à surcharger
      authorUserId: 0, // à surcharger
      authorRole: CHAT_AUTHOR_ROLES.CANDIDATE as ChatMessage['authorRole'],
      body: faker.lorem.sentence(),
    }
  })
  .state('fromExpert', (message) => {
    message.authorRole = CHAT_AUTHOR_ROLES.EXPERT
  })
  .build()
