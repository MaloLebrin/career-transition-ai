import {
  NOTIFICATION_STATUSES,
  NOTIFICATION_TYPES,
  type NotificationStatus,
  type NotificationType,
} from '#shared/constants/notifications'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from './user.js'

export { NOTIFICATION_STATUSES, NOTIFICATION_TYPES }

export default class Notification extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare type: NotificationType

  @column()
  declare status: NotificationStatus

  @column()
  declare title: string

  @column()
  declare body: string | null

  @column({
    consume: (value: string) => (typeof value === 'string' ? JSON.parse(value) : value),
    prepare: (value: unknown) => (typeof value === 'object' && value !== null ? JSON.stringify(value) : value),
  })
  declare meta: Record<string, unknown> | null

  @column.dateTime()
  declare readAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
