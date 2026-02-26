import Employee from '#models/employee'
import User from '#models/user'
import { generateSlug } from '#utils/slug'
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
    if (!organization.$dirty.name) {
      return
    }

    // Si un slug explicite a été fourni, on le respecte
    if (organization.$dirty.slug && organization.slug) {
      return
    }

    const base = generateSlug(organization.name)
    if (!base) {
      organization.slug = ''
      return
    }

    // On récupère tous les slugs qui commencent par base ou base-<num>
    const existing = await Organization.query()
      .where('slug', base)
      .orWhereLike('slug', `${base}-%`)
      .select('slug')

    if (existing.length === 0) {
      organization.slug = base
      return
    }

    const existingSlugs = existing.map((row) => row.slug)
    let suffix = 2

    while (existingSlugs.includes(`${base}-${suffix}`)) {
      suffix++
    }

    organization.slug = `${base}-${suffix}`
  }
}
