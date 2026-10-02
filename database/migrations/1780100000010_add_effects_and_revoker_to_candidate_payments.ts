import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Facturation, correctifs de la revue #109 :
 *
 * - `unlock_effects_at` / `revoke_effects_at` : marqueurs posés quand les
 *   effets de bord d'un déblocage (jobs IA) ou d'un retrait de droit ont été
 *   exécutés. Une reprise du webhook sur un paiement déjà `paid` / `refunded`
 *   rejoue les effets tant que le marqueur est nul (docs/STRIPE.md).
 * - `revoked_by_user_id` : auteur d'une révocation manuelle, au lieu d'un
 *   suffixe libre dans `revoke_reason`. SET NULL : l'enregistrement comptable
 *   survit à la suppression du compte.
 *
 * Les paiements existants sont considérés comme déjà traités (marqueurs
 * rétro-remplis) pour qu'aucune notification ne soit renvoyée.
 */
export default class extends BaseSchema {
  protected tableName = 'candidate_payments'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('unlock_effects_at', { useTz: true }).nullable()
      table.timestamp('revoke_effects_at', { useTz: true }).nullable()
      table
        .integer('revoked_by_user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
    })

    this.defer(async (db) => {
      await db.rawQuery(
        `UPDATE ${this.tableName} SET unlock_effects_at = paid_at WHERE paid_at IS NOT NULL`
      )
      await db.rawQuery(
        `UPDATE ${this.tableName} SET revoke_effects_at = revoked_at WHERE revoked_at IS NOT NULL`
      )
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('revoked_by_user_id')
      table.dropColumn('revoke_effects_at')
      table.dropColumn('unlock_effects_at')
    })
  }
}
