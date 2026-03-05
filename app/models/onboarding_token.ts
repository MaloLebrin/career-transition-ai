import User from '#models/user'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'

export default class OnboardingToken extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare token: string

  @column.dateTime()
  declare expiresAt: DateTime

  @column.dateTime({ serializeAs: null })
  declare usedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  static async createForUser(userId: number, expiresInDays = 7): Promise<OnboardingToken> {
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = DateTime.now().plus({ days: expiresInDays })
    return OnboardingToken.create({
      userId,
      token,
      expiresAt,
      usedAt: null,
    })
  }

  isValid(): boolean {
    return !this.usedAt && this.expiresAt > DateTime.now()
  }
}
