import ChatConversation from '#models/chat_conversation'
import User from '#models/user'
import type { ChatAuthorRole } from '#shared/constants/chat'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

/** Message d'une conversation du chat candidat ↔ expert. Jamais modifié. */
export default class ChatMessage extends BaseModel {
  static table = 'chat_messages'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare conversationId: number

  @column()
  declare authorUserId: number

  @column()
  declare authorRole: ChatAuthorRole

  @column()
  declare body: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => ChatConversation, { foreignKey: 'conversationId' })
  declare conversation: BelongsTo<typeof ChatConversation>

  @belongsTo(() => User, { foreignKey: 'authorUserId' })
  declare author: BelongsTo<typeof User>
}
