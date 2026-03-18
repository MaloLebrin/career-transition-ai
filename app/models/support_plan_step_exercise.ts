import SupportPlanStep from '#models/support_plan_step'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import type { ExerciceResultType } from './exercise_result.js'

export default class SupportPlanStepExercise extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare supportPlanStepId: number

  @column()
  declare exerciseType: ExerciceResultType

  @column()
  declare sortOrder: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => SupportPlanStep)
  declare supportPlanStep: BelongsTo<typeof SupportPlanStep>
}
