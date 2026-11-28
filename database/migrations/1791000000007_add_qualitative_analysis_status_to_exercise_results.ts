import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Statut explicite de l'analyse IA qualitative (#171) : `pending` (job en file
 * ou en cours d'essais), `done`, `failed` (essais épuisés, relance manuelle
 * possible par le conseiller). `null` : aucune analyse demandée.
 *
 * Valeurs figées ici (et non importées) : une migration jouée ne doit pas
 * changer si l'enum évolue. Synchronisées avec `QUALITATIVE_ANALYSIS_STATUSES`
 * (`shared/constants/exercises.ts`).
 */
export default class extends BaseSchema {
  protected tableName = 'exercise_results'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .string('qualitative_analysis_status', 20)
        .nullable()
        .checkIn(
          ['pending', 'done', 'failed'],
          'exercise_results_qualitative_analysis_status_check'
        )
    })

    // Les analyses déjà enregistrées sont terminées ; les autres restent `null`
    // (aucun échec passé n'a été tracé, cf. #171).
    this.defer(async (db) => {
      await db
        .from(this.tableName)
        .whereNotNull('qualitative_analysis')
        .update({ qualitative_analysis_status: 'done' })
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('qualitative_analysis_status')
    })
  }
}
