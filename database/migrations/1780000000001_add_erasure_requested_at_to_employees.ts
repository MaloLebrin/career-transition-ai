import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * #70 — date de la demande d'effacement RGPD faite par le candidat depuis
 * l'app. Traitée par `node ace candidate:purge` (docs/RGPD.md), qui supprime
 * la fiche : la colonne ne sert qu'au suivi du délai d'un mois.
 */
export default class extends BaseSchema {
  protected tableName = 'employees'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('erasure_requested_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('erasure_requested_at')
    })
  }
}
