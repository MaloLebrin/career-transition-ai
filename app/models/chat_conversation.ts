import ChatMessage from '#models/chat_message'
import Employee from '#models/employee'
import User from '#models/user'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

/**
 * Conversation candidat ↔ experts : une par candidat. Sans expert
 * (`assigned_expert_user_id` nul) elle est dans la file de l'équipe ; l'expert
 * de la fiche (`employees.advisor_id`, s'il est de la plateforme) prime. Supprimée
 * avec la fiche candidat (`ON DELETE CASCADE`).
 */
export default class ChatConversation extends BaseModel {
  static table = 'chat_conversations'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare employeeId: number

  @column()
  declare assignedExpertUserId: number | null

  @column.dateTime()
  declare lastMessageAt: DateTime | null

  @column.dateTime()
  declare candidateLastReadAt: DateTime | null

  @column.dateTime()
  declare expertLastReadAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Employee)
  declare employee: BelongsTo<typeof Employee>

  @belongsTo(() => User, { foreignKey: 'assignedExpertUserId' })
  declare assignedExpert: BelongsTo<typeof User>

  @hasMany(() => ChatMessage, { foreignKey: 'conversationId' })
  declare messages: HasMany<typeof ChatMessage>
}
