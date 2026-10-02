import Employee from '#models/employee'
import Notification from '#models/notification'
import Organization from '#models/organization'
import type { UserRole } from '#shared/types/advisor/roles'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { BaseModel, belongsTo, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare organizationId: number

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare name: string

  @column()
  declare role: UserRole

  /** Première activation du compte (mot de passe définitif / inscription directe). */
  @column.dateTime()
  declare onboardingCompletedAt: DateTime | null

  /** Acceptation des CGU à l'inscription en libre-service (#93) ; `null` pour les comptes invités. */
  @column.dateTime()
  declare termsAcceptedAt: DateTime | null

  /** Version des CGU acceptées (`TERMS_VERSION`, `shared/constants/legal.ts`). */
  @column()
  declare termsVersion: string | null

  /** Adresse e-mail confirmée par lien (#98) ; `null` tant que non vérifiée. */
  @column.dateTime()
  declare emailVerifiedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => Organization)
  declare organization: BelongsTo<typeof Organization>

  @hasMany(() => Employee, { foreignKey: 'advisorId' })
  declare advisedEmployees: HasMany<typeof Employee>

  @hasOne(() => Employee, { foreignKey: 'userId' })
  declare employeeProfile: HasOne<typeof Employee>

  @hasMany(() => Notification)
  declare notifications: HasMany<typeof Notification>
}
