import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

/**
 * Événement webhook Stripe reçu (#104) : clé d'idempotence, sans payload.
 * `processedAt` nul = traitement interrompu ; une nouvelle livraison du même
 * `stripeEventId` le reprend, une livraison d'un événement déjà traité est
 * ignorée.
 */
export default class StripeEvent extends BaseModel {
  static table = 'stripe_events'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare stripeEventId: string

  @column()
  declare type: string

  @column({ consume: Boolean })
  declare livemode: boolean

  @column.dateTime()
  declare processedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  get isProcessed(): boolean {
    return this.processedAt !== null
  }
}
