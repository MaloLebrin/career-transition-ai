import User from '#models/user'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { QueryClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'
import { createHash, randomBytes } from 'node:crypto'

export default class OnboardingToken extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  /**
   * Empreinte SHA-256 (hex) du secret du lien d'onboarding, jamais le secret
   * lui-même (#65) : une fuite de la base ou d'une sauvegarde ne donne pas de
   * lien utilisable. Jamais sérialisée.
   */
  @column({ serializeAs: null })
  declare token: string

  /**
   * Secret en clair, pour le lien envoyé par e-mail. Présent seulement sur
   * l'instance renvoyée par `createForUser` : il n'est jamais enregistré.
   */
  declare plainToken?: string

  @column.dateTime()
  declare expiresAt: DateTime

  @column.dateTime({ serializeAs: null })
  declare usedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  /** Empreinte stockée pour un secret de lien. */
  static hash(plainToken: string): string {
    return createHash('sha256').update(plainToken).digest('hex')
  }

  static async createForUser(
    userId: number,
    options: { expiresInDays?: number; client?: QueryClientContract } = {}
  ): Promise<OnboardingToken> {
    const plainToken = randomBytes(32).toString('hex')
    const record = await OnboardingToken.create(
      {
        userId,
        token: OnboardingToken.hash(plainToken),
        expiresAt: DateTime.now().plus({ days: options.expiresInDays ?? 7 }),
        usedAt: null,
      },
      { client: options.client }
    )
    record.plainToken = plainToken
    return record
  }

  isValid(): boolean {
    return !this.usedAt && this.expiresAt > DateTime.now()
  }
}
