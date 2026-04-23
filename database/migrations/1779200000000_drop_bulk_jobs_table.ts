import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Supprime la table `bulk_jobs` : les suivis PDF passent par `pdf_exports`.
 * Rollback non fourni (données historiques non recréées).
 */
export default class extends BaseSchema {
  protected tableName = 'bulk_jobs'

  async up() {
    // Knex + sqlite peut émettre un DROP sans IF EXISTS selon versions ; le SQL brut est sûr.
    await this.db.rawQuery(`DROP TABLE IF EXISTS "${this.tableName}"`)
  }

  async down() {
    // Irreversible: ne pas recréer bulk_jobs ici.
  }
}
