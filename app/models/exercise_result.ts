import Employee from '#models/employee'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import {
  exerciceResultTypesValues,
  type ExerciceResultStatus,
  type ExerciceResultType,
} from '../../shared/constants/exercises.js'

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

  @column()
  declare progressPercent: number | null

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

// Ré-export pour compatibilité des imports existants (#models/exercise_result)
export { exerciceResultTypesValues }
export type { ExerciceResultType }
