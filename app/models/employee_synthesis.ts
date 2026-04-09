import Employee from '#models/employee'
import Organization from '#models/organization'
import User from '#models/user'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export const EMPLOYEE_SYNTHESIS_SHARE_STATUSES = {
  DRAFT: 'draft',
  SHARED: 'shared',
} as const

export type EmployeeSynthesisShareStatus =
  (typeof EMPLOYEE_SYNTHESIS_SHARE_STATUSES)[keyof typeof EMPLOYEE_SYNTHESIS_SHARE_STATUSES]

export const employeeSynthesisShareStatusValues = Object.values(EMPLOYEE_SYNTHESIS_SHARE_STATUSES)

export default class EmployeeSynthesis extends BaseModel {
  static table = 'employee_syntheses'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare organizationId: number

  @column()
  declare employeeId: number

  @column()
  declare shareStatus: EmployeeSynthesisShareStatus

  @column.dateTime()
  declare sharedAt: DateTime | null

  @column()
  declare sharedByUserId: number | null

  /**
   * Visible to the talent + included in shareable exports.
   */
  @column()
  declare expertCommentsShared: string | null

  /**
   * Only visible to the expert. Never exposed to the talent or shareable exports.
   */
  @column()
  declare expertNotesInternal: string | null

  /**
   * If present, supersedes auto-generated executive summary bullets.
   */
  @column()
  declare executiveSummaryOverride: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Organization)
  declare organization: BelongsTo<typeof Organization>

  @belongsTo(() => Employee)
  declare employee: BelongsTo<typeof Employee>

  @belongsTo(() => User, { foreignKey: 'sharedByUserId' })
  declare sharedByUser: BelongsTo<typeof User>
}

