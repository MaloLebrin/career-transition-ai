import Employee from '#models/employee'
import Organization from '#models/organization'
import User from '#models/user'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export const APPOINTMENTS_STATUSES = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const

export type AppointmentStatus = (typeof APPOINTMENTS_STATUSES)[keyof typeof APPOINTMENTS_STATUSES]

export const appointmentStatusValues = Object.values(APPOINTMENTS_STATUSES)

export default class Appointment extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare organizationId: number

  @column()
  declare employeeId: number

  @column()
  declare advisorId: number | null

  @column.dateTime()
  declare scheduledAt: DateTime

  @column.dateTime()
  declare endedAt: DateTime | null

  @column()
  declare type: string | null

  @column()
  declare status: AppointmentStatus

  @column()
  declare notes: string | null

  @column()
  declare locationOrLink: string | null

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

  @belongsTo(() => User, { foreignKey: 'advisorId' })
  declare advisor: BelongsTo<typeof User>
}
