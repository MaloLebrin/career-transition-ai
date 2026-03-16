import { ExperienceType } from '#shared/constants/experience'
import Employee from '#models/employee'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class Experience extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare employeeId: number

  @column()
  declare title: string

  @column()
  declare company: string

  @column()
  declare type: ExperienceType | null

  @column.date()
  declare startDate: DateTime

  @column.date()
  declare endDate: DateTime | null

  @column()
  declare isCurrent: boolean | null

  @column()
  declare description: string | null

  @column()
  declare sortOrder: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Employee)
  declare employee: BelongsTo<typeof Employee>
}
