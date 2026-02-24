import Appointment from '#models/appointment'
import Education from '#models/education'
import Experience from '#models/experience'
import File from '#models/file'
import Organization from '#models/organization'
import Skill from '#models/skill'
import SupportPlanStep from '#models/support_plan_step'
import User from '#models/user'
import { BaseModel, belongsTo, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import ExerciseResult from './exercise_result.js'

export const EMPLOYEES_STATUS = {
  ACTIVE: 'active',
  completed: 'completed',
  ON_HOLD: 'on-hold',
} as const

export type EmployeeStatus = (typeof EMPLOYEES_STATUS)[keyof typeof EMPLOYEES_STATUS]

export const employeeStatusValues = Object.values(EMPLOYEES_STATUS)

export default class Employee extends BaseModel {
  static table = 'employees'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare organizationId: number

  @column()
  declare advisorId: number | null

  @column()
  declare userId: number | null

  @column()
  declare name: string

  @column()
  declare email: string

  @column()
  declare currentRole: string

  @column()
  declare targetRole: string | null

  @column()
  declare summary: string | null

  @column()
  declare advisorNotes: string | null

  @column()
  declare status: EmployeeStatus

  @column()
  declare onboarded: boolean

  @column.dateTime()
  declare nextAppointment: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => Organization)
  declare organization: BelongsTo<typeof Organization>

  @belongsTo(() => User, { foreignKey: 'advisorId' })
  declare advisor: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @hasMany(() => Experience)
  declare experiences: HasMany<typeof Experience>

  @hasMany(() => Education)
  declare educations: HasMany<typeof Education>

  @hasMany(() => ExerciseResult)
  declare exerciseResults: HasMany<typeof ExerciseResult>

  @hasMany(() => SupportPlanStep)
  declare supportPlanSteps: HasMany<typeof SupportPlanStep>

  @hasMany(() => Appointment)
  declare appointments: HasMany<typeof Appointment>

  @hasMany(() => File)
  declare files: HasMany<typeof File>

  @manyToMany(() => Skill, {
    pivotTable: 'employee_skills',
    pivotColumns: ['level'],
    pivotTimestamps: true,
  })
  declare skills: ManyToMany<typeof Skill>
}
