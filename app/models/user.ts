import Employee from '#models/employee'
import Organization from '#models/organization'
import type { UserRole } from '#shared/types/advisor/roles'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { BaseModel, beforeSave, belongsTo, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

// @ts-expect-error AuthFinder mixin expects hashPassword generic signature; our concrete override is correct at runtime
export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare organizationId: number

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @beforeSave()
  static async hashPassword(this: typeof User, user: User) {
    if (!user.$dirty.password) return
    const p = user.password
    const alreadyHashed =
      typeof p === 'string' &&
      (p.startsWith('$argon2') ||
        p.startsWith('$scrypt') ||
        p.startsWith('$2a$') ||
        p.startsWith('$2b$') ||
        p.startsWith('$2y$'))
    if (!alreadyHashed) {
      user.password = await hash.make(user.password)
    }
  }

  @column()
  declare name: string

  @column()
  declare role: UserRole

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
}
