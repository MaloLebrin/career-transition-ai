import type ChatMessage from '#models/chat_message'
import type { ChatMessageView } from '#shared/types/chat/views'
import { BaseTransformer } from '@adonisjs/core/transformers'

/** Message du chat tel que rendu et diffusé sur Transmit : aucun nom, aucune relation. */
export function chatMessageView(message: ChatMessage): ChatMessageView {
  return {
    id: message.id,
    authorRole: message.authorRole,
    body: message.body,
    createdAt: message.createdAt.toISO()!,
  }
}

export default class ChatMessageTransformer extends BaseTransformer<ChatMessage> {
  toObject(): ChatMessageView {
    return chatMessageView(this.resource)
  }
}
