import { PROMO_CODE_MAX } from '../../shared/constants/billing.js'
import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Codes promo Stripe sur le forfait (#139).
 *
 * - `discount_cents` : remise appliquée par le code (`total_details.amount_discount`),
 *   0 sans code. `amount_cents` devient le montant réellement encaissé, si bien
 *   que `amount_cents + discount_cents` reste le prix catalogue annoncé par
 *   Stripe (`amount_subtotal`) : c'est l'invariant du recoupement.
 * - `promo_code` : libellé saisi par le candidat (« BIENVENUE20 »), relu chez
 *   Stripe au mieux ; `stripe_promotion_code_id` : l'id `promo_…` transmis par
 *   le webhook. Références, pas des secrets (garde `secret_model_columns`).
 */
export default class extends BaseSchema {
  protected tableName = 'candidate_payments'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('discount_cents').notNullable().defaultTo(0)
      table.string('promo_code', PROMO_CODE_MAX).nullable()
      table.string('stripe_promotion_code_id', 255).nullable()
    })

    this.defer(async (db) => {
      await db.rawQuery(
        `ALTER TABLE "${this.tableName}" ADD CONSTRAINT "${this.tableName}_discount_cents_check" CHECK (discount_cents >= 0)`
      )
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery(
        `ALTER TABLE "${this.tableName}" DROP CONSTRAINT IF EXISTS "${this.tableName}_discount_cents_check"`
      )
    })
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('stripe_promotion_code_id')
      table.dropColumn('promo_code')
      table.dropColumn('discount_cents')
    })
  }
}
