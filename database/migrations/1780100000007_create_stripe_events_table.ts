import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * #104 — journal d'idempotence du webhook Stripe. Un événement livré deux
 * fois (rejeu, retry) n'est traité qu'une fois. **Aucun payload** : seuls
 * l'id Stripe, le type et le mode sont conservés — pas de PII.
 */
export default class extends BaseSchema {
  protected tableName = 'stripe_events'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('stripe_event_id', 255).notNullable().unique()
      table.string('type', 100).notNullable()
      table.boolean('livemode').notNullable().defaultTo(false)
      /** Posé à la fin du traitement ; `NULL` = livraison interrompue, à rejouer. */
      table.timestamp('processed_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
