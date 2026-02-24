import Employee from '#models/employee'
import Organization from '#models/organization'
import { BaseModel, belongsTo, column, manyToMany } from '@adonisjs/lucid/orm'
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
}
