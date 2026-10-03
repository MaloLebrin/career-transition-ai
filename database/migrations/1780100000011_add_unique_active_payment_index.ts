import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Billing, correctifs de la revue #109 : un candidat n'a qu'un droit actif.
 *
 * Index unique partiel sur `candidate_payments(employee_id)` pour les lignes
 * `paid` non révoquées : deux achats concurrents ou un octroi manuel pendant
 * un paiement ne peuvent plus ouvrir deux droits.
 *
 * Données existantes : si un candidat cumule déjà plusieurs paiements actifs
 * (démo, octroi manuel + paiement), seul le plus récent reste actif ; les
 * autres sont révoqués avec un motif explicite — la ligne et son statut `paid`
 * sont conservés (pièce comptable), le droit reste ouvert par le plus récent.
 */
export default class extends BaseSchema {
  protected tableName = 'candidate_payments'
  protected indexName = 'candidate_payments_one_active_per_employee'

  async up() {
    this.defer(async (db) => {
      await db.rawQuery(
        `UPDATE ${this.tableName} SET revoked_at = NOW(),
           revoke_reason = 'Doublon régularisé par migration : un autre paiement ouvre le droit'
         WHERE status = 'paid' AND revoked_at IS NULL AND employee_id IS NOT NULL
           AND id NOT IN (
             SELECT DISTINCT ON (employee_id) id FROM ${this.tableName}
             WHERE status = 'paid' AND revoked_at IS NULL AND employee_id IS NOT NULL
             ORDER BY employee_id, paid_at DESC NULLS LAST, id DESC
           )`
      )
      await db.rawQuery(
        `CREATE UNIQUE INDEX ${this.indexName} ON ${this.tableName} (employee_id)
         WHERE status = 'paid' AND revoked_at IS NULL`
      )
    })
  }

  async down() {
    this.schema.raw(`DROP INDEX IF EXISTS ${this.indexName}`)
  }
}
