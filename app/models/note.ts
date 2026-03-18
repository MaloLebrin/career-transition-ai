import type { NoteVisibility } from '#shared/constants/note'
import Employee from '#models/employee'
import ExerciseResult from '#models/exercise_result'
import Organization from '#models/organization'
import SupportPlanStep from '#models/support_plan_step'
import User from '#models/user'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class Note extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare organizationId: number

  @column()
  declare employeeId: number

  @column()
  declare authorId: number

  @column()
  declare supportPlanStepId: number | null

  @column()
  declare exerciseResultId: number | null

  @column()
  declare visibility: NoteVisibility

  @column()
  declare content: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => Organization)
  declare organization: BelongsTo<typeof Organization>

  @belongsTo(() => Employee)
  declare employee: BelongsTo<typeof Employee>

  @belongsTo(() => User, { foreignKey: 'authorId' })
  declare author: BelongsTo<typeof User>

  @belongsTo(() => SupportPlanStep)
  declare supportPlanStep: BelongsTo<typeof SupportPlanStep>

  @belongsTo(() => ExerciseResult)
  declare exerciseResult: BelongsTo<typeof ExerciseResult>
}
