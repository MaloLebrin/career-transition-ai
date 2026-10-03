import CandidatePayment from '#models/candidate_payment'
import ExpertRequest from '#models/expert_request'
import Education from '#models/education'
import Experience from '#models/experience'
import Note from '#models/note'
import Organization from '#models/organization'
import Skill from '#models/skill'
import SupportPlanStep from '#models/support_plan_step'
import User from '#models/user'
import type { AccountType } from '#shared/constants/b2c'
import type { EmployeeStatus } from '#shared/constants/employee'
import { BaseModel, belongsTo, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import EmployeeSynthesis from './employee_synthesis.js'
import ExerciseResult from './exercise_result.js'

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

  /** `b2b` : invité par un cabinet ; `b2c` : particulier inscrit seul (#92). */
  @column()
  declare accountType: AccountType

  @column({
    consume: (value) => Boolean(value),
  })
  declare onboarded: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  /** Demande d'effacement RGPD faite depuis l'app (#70), traitée par `candidate:purge`. */
  @column.dateTime()
  declare erasureRequestedAt: DateTime | null

  @belongsTo(() => Organization)
  declare organization: BelongsTo<typeof Organization>

  @belongsTo(() => User, { foreignKey: 'advisorId' })
  declare advisor: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @hasMany(() => Experience, {
    onQuery: (query) => {
      return query.orderBy('start_date', 'desc')
    },
  })
  declare experiences: HasMany<typeof Experience>

  @hasMany(() => Education, {
    onQuery: (query) => {
      return query.orderBy('start_date', 'desc')
    },
  })
  declare educations: HasMany<typeof Education>

  @hasMany(() => ExerciseResult)
  declare exerciseResults: HasMany<typeof ExerciseResult>

  @hasMany(() => SupportPlanStep)
  declare supportPlanSteps: HasMany<typeof SupportPlanStep>

  @hasMany(() => Note)
  declare notes: HasMany<typeof Note>

  @hasMany(() => EmployeeSynthesis)
  declare syntheses: HasMany<typeof EmployeeSynthesis>

  /** Paiements du forfait particuliers (#94) ; FK en SET NULL, donc hors cascade de purge. */
  @hasMany(() => CandidatePayment)
  declare payments: HasMany<typeof CandidatePayment>

  /** Demandes d'accompagnement par un expert (#103) ; FK en CASCADE. */
  @hasMany(() => ExpertRequest)
  declare expertRequests: HasMany<typeof ExpertRequest>

  @manyToMany(() => Skill, {
    pivotTable: 'employee_skills',
    pivotColumns: ['level'],
    pivotTimestamps: true,
  })
  declare skills: ManyToMany<typeof Skill>
}
