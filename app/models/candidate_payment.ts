import Employee from '#models/employee'
import Organization from '#models/organization'
import User from '#models/user'
import type { PaymentProduct, PaymentProvider, PaymentStatus } from '#shared/constants/billing'
import { PAYMENT_STATUSES } from '#shared/constants/billing'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

/**
 * Paiement du forfait particuliers (#94). Un droit d'accès aux résultats est
 * ouvert par un paiement `paid` non révoqué (`EntitlementsService`).
 *
 * `employeeId` / `userId` deviennent `null` après purge RGPD : la ligne reste
 * comme pièce comptable anonymisée.
 */
export default class CandidatePayment extends BaseModel {
  static table = 'candidate_payments'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare employeeId: number | null

  @column()
  declare userId: number | null

  @column()
  declare organizationId: number

  @column()
  declare productCode: PaymentProduct

  @column()
  declare provider: PaymentProvider

  @column()
  declare status: PaymentStatus

  @column()
  declare amountCents: number

  @column()
  declare currency: string

  /** Référence de la session Stripe Checkout (unique) ; `null` pour un octroi manuel. */
  @column()
  declare stripeCheckoutSessionId: string | null

  @column()
  declare stripePaymentIntentId: string | null

  @column.dateTime()
  declare paidAt: DateTime | null

  @column.dateTime()
  declare refundedAt: DateTime | null

  /** Accès retiré par un super admin sans remboursement Stripe (#107). */
  @column.dateTime()
  declare revokedAt: DateTime | null

  @column()
  declare revokeReason: string | null

  /** Super admin à l'origine d'un octroi manuel (`provider = manual`). */
  @column()
  declare grantedByUserId: number | null

  /** Super admin à l'origine d'une révocation manuelle (#107) ; `null` pour un remboursement Stripe. */
  @column()
  declare revokedByUserId: number | null

  /** Effets du déblocage (jobs IA) exécutés ; nul = à rejouer à la reprise du webhook. */
  @column.dateTime()
  declare unlockEffectsAt: DateTime | null

  /** Effets du retrait de droit exécutés ; nul = à rejouer. */
  @column.dateTime()
  declare revokeEffectsAt: DateTime | null

  /** Renonciation expresse au droit de rétractation cochée au paiement (#102). */
  @column.dateTime()
  declare withdrawalWaivedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Employee)
  declare employee: BelongsTo<typeof Employee>

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Organization)
  declare organization: BelongsTo<typeof Organization>

  @belongsTo(() => User, { foreignKey: 'grantedByUserId' })
  declare grantedBy: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'revokedByUserId' })
  declare revokedBy: BelongsTo<typeof User>

  /** Ce paiement ouvre-t-il l'accès aux résultats aujourd'hui ? */
  get grantsAccess(): boolean {
    return this.status === PAYMENT_STATUSES.PAID && this.revokedAt === null
  }
}
