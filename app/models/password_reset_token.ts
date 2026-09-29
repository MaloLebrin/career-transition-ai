import User from '#models/user'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { QueryClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'
import { createHash, randomBytes } from 'node:crypto'

/** Durée de validité d'un lien « mot de passe oublié » (#68). */
export const PASSWORD_RESET_TOKEN_TTL_MINUTES = 60

export default class PasswordResetToken extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  /**
   * Empreinte SHA-256 (hex) du secret du lien, jamais le secret lui-même :
   * une fuite de la base ne donne pas de lien utilisable. Jamais sérialisée.
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
    options: { client?: QueryClientContract } = {}
  ): Promise<PasswordResetToken> {
    const plainToken = randomBytes(32).toString('hex')
    const record = await PasswordResetToken.create(
      {
        userId,
        token: PasswordResetToken.hash(plainToken),
        expiresAt: DateTime.now().plus({ minutes: PASSWORD_RESET_TOKEN_TTL_MINUTES }),
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
