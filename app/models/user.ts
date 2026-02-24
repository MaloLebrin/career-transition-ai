import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { BaseModel, belongsTo, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Organization from './organization.js'

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

  @hasMany(() => Appointment, { foreignKey: 'advisorId' })
  declare appointments: HasMany<typeof Appointment>
}

export const USERS_ROLES = {
  ADVISOR: 'advisor',
  EMPLOYEE: 'employee',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const

export type UserRole = (typeof USERS_ROLES)[keyof typeof USERS_ROLES]

export const userRolesValues = Object.values(USERS_ROLES)
