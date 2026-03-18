import Employee from '#models/employee'
import SupportPlanStepExercise from '#models/support_plan_step_exercise'
import User from '#models/user'
import type { AppointmentStatus } from '#shared/constants/appointment'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class SupportPlanStep extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare employeeId: number

  @column()
  declare advisorId: number | null

  @column()
  declare title: string | null

  @column()
  declare description: string | null

  @column()
  declare instructions: string | null

  @column.date()
  declare dueDate: DateTime | null

  @column.dateTime()
  declare scheduledAt: DateTime | null

  @column.dateTime()
  declare endedAt: DateTime | null

  @column()
  declare status: AppointmentStatus

  @column()
  declare locationOrLink: string | null

  @column({
    consume: (value) => Boolean(value),
  })
  declare completed: boolean

  @column()
  declare notes: string | null

  @column()
  declare sortOrder: number | null

  @column({
    consume: (value) => Boolean(value),
  })
  declare isLocked: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Employee)
  declare employee: BelongsTo<typeof Employee>

  @belongsTo(() => User, { foreignKey: 'advisorId' })
  declare advisor: BelongsTo<typeof User>

  @hasMany(() => SupportPlanStepExercise)
  declare exercises: HasMany<typeof SupportPlanStepExercise>
}
