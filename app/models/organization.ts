import Employee from '#models/employee'
import User from '#models/user'
import { assignUniqueSlugForModel } from '#utils/slug'
import { BaseModel, beforeSave, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class Organization extends BaseModel {
  static table = 'organizations'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare logoUrl: string | null

  /** `public_id` Cloudinary du logo (`#services/branding_service`), jamais exposé. */
  @column({ serializeAs: null })
  declare logoPublicId: string | null

  /** Organisation plateforme (#92) : super admins, experts internes, candidats B2C. Une seule. */
  @column({ consume: (value) => Boolean(value) })
  declare isPlatform: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  @hasMany(() => User)
  declare users: HasMany<typeof User>

  @hasMany(() => Employee)
  declare employees: HasMany<typeof Employee>

  @beforeSave()
  static async assignSlug(organization: Organization) {
    await assignUniqueSlugForModel(Organization, organization, {
      sourceField: 'name',
      targetField: 'slug',
      allowNull: false,
    })
  }
}
