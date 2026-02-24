import Employee from '#models/employee'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export const EXERCICE_RESULTS_TYPES = {
  MOTIVATION: 'motivation',
  VALUES: 'values',
  PERSONALITY: 'personality',
  COMPETENCIES: 'competencies',
  LIFE_CURVE: 'life_curve',
  CV_ANALYSIS: 'cv_analysis',
  TARGETING: 'targeting',
  DISC: 'disc',
  CIRCLE_OF_CONTROL: 'circle_of_control',
  SKILL_MAPPING: 'skill_mapping',
} as const

export const exerciceResultTypesValues = Object.values(EXERCICE_RESULTS_TYPES)

export type ExerciceResultType =
  (typeof EXERCICE_RESULTS_TYPES)[keyof typeof EXERCICE_RESULTS_TYPES]

export const exerciceResultStatusValues = {
  DRAFT: 'draft',
  COMPLETED: 'completed',
} as const

export type ExerciceResultStatus =
  (typeof exerciceResultStatusValues)[keyof typeof exerciceResultStatusValues]

export const exerciceResultStatusValuesValues = Object.values(exerciceResultStatusValues)

export default class ExerciseResult extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare employeeId: number

  @column()
  declare type: ExerciceResultType

  @column()
  declare status: ExerciceResultStatus

  @column.date()
  declare date: DateTime | null

  @column()
  declare duration: number | null

  @column({
    consume: (value: string) => (typeof value === 'string' ? JSON.parse(value) : value),
    prepare: (value: unknown) => (typeof value === 'object' ? JSON.stringify(value) : value),
  })
  declare data: Record<string, unknown>

  @column()
  declare quantitativeScore: number | null

  @column()
  declare qualitativeAnalysis: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Employee)
  declare employee: BelongsTo<typeof Employee>
}
