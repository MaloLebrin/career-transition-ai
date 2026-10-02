import Employee from '#models/employee'
import Organization from '#models/organization'
import User from '#models/user'
import { EXPERT_REQUEST_STATUSES, type ExpertRequestStatus } from '#shared/constants/expert_request'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

/**
 * Demande d'accompagnement par un expert interne (#103). Déposée par un
 * particulier au forfait réglé, traitée par un super admin (#105) qui
 * assigne l'expert (`employees.advisor_id`). Supprimée avec la fiche
 * candidat (`ON DELETE CASCADE`).
 */
export default class ExpertRequest extends BaseModel {
  static table = 'expert_requests'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare employeeId: number

  @column()
  declare organizationId: number

  /** Attentes du candidat, texte libre. */
  @column()
  declare message: string

  @column()
  declare availability: string | null

  @column()
  declare status: ExpertRequestStatus

  /** Super admin qui a traité la demande. */
  @column()
  declare handledByUserId: number | null

  /** Expert assigné (rôle `advisor` de l'organisation plateforme). */
  @column()
  declare assignedExpertUserId: number | null

  @column.dateTime()
  declare handledAt: DateTime | null

  @column()
  declare declineReason: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Employee)
  declare employee: BelongsTo<typeof Employee>

  @belongsTo(() => Organization)
  declare organization: BelongsTo<typeof Organization>

  @belongsTo(() => User, { foreignKey: 'handledByUserId' })
  declare handledBy: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'assignedExpertUserId' })
  declare assignedExpert: BelongsTo<typeof User>

  get isPending(): boolean {
    return this.status === EXPERT_REQUEST_STATUSES.PENDING
  }
}
