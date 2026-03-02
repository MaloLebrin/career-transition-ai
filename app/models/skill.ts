import Employee from '#models/employee'
import Organization from '#models/organization'
import { generateSlug } from '#utils/slug'
import { BaseModel, beforeSave, belongsTo, column, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class Skill extends BaseModel {
  static table = 'skills'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare organizationId: number | null

  @column()
  declare name: string

  @column()
  declare slug: string | null

  @column()
  declare category: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => Organization)
  declare organization: BelongsTo<typeof Organization>

  @manyToMany(() => Employee, {
    pivotTable: 'employee_skills',
    pivotColumns: ['level'],
    pivotTimestamps: true,
  })
  declare employees: ManyToMany<typeof Employee>

  @beforeSave()
  static async assignSlug(skill: Skill) {
    if (!skill.$dirty.name) {
      return
    }

    // Si un slug explicite a été fourni, on le respecte
    if (skill.$dirty.slug && skill.slug) {
      return
    }

    const base = generateSlug(skill.name)
    if (!base) {
      skill.slug = null
      return
    }

    // slug est nullable + unique en base. On s'aligne sur Organization pour la stratégie.
    const existing = await Skill.query()
      .where('slug', base)
      .orWhereLike('slug', `${base}-%`)
      .select('slug')

    if (existing.length === 0) {
      skill.slug = base
      return
    }

    const existingSlugs = existing.map((row) => row.slug).filter((s): s is string => !!s)
    let suffix = 2

    while (existingSlugs.includes(`${base}-${suffix}`)) {
      suffix++
    }

    skill.slug = `${base}-${suffix}`
  }
}
