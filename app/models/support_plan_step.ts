import Employee from '#models/employee'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import { ExerciceResultType } from './exercice_result.js'

export default class SupportPlanStep extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare employeeId: number

  @column()
  declare title: string

  @column()
  declare description: string | null

  @column.date()
  declare dueDate: DateTime

  @column()
  declare completed: boolean

  @column()
  declare notes: string | null

  @column()
  declare associatedExercise: ExerciceResultType | null

  @column()
  declare sortOrder: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Employee)
  declare employee: BelongsTo<typeof Employee>
}
