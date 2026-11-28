import { BaseSchema } from '@adonisjs/lucid/schema'
import type { QueryClientContract } from '@adonisjs/lucid/types/database'

/** Reprise des données, exportée pour être testée (`tests/unit/database/`). */
export async function backfillExerciseAnalyses(db: QueryClientContract): Promise<void> {
  await db
    .from('exercise_results')
    .where('qualitative_analysis', '')
    .update({ qualitative_analysis: null })
  await db
    .from('exercise_results')
    .whereNotNull('qualitative_analysis')
    .whereNull('analyzed_at')
    .update({ analyzed_at: db.raw('updated_at') })
}

/**
 * Analyse IA d'un exercice (#168) : `analyzed_at` marque qu'une analyse a été
 * produite pour ce résultat, indépendamment du texte. La politique B2C « une
 * analyse » s'appuie sur ce marqueur : le texte est effacé quand les réponses
 * changent (il décrirait les anciennes), sans rouvrir le droit à l'analyse.
 *
 * Reprise des données : les résultats qui ont déjà un texte d'analyse sont
 * marqués analysés ; les chaînes vides envoyées par l'ancien front
 * (`qualitativeAnalysis: ''`) redeviennent `NULL`, sans quoi
 * `EntitlementsService.onResultsUnlocked` (`whereNull`) les ignorerait.
 * `down()` retire la colonne ; les chaînes vides ne sont pas restaurées
 * (`NULL` et `''` signifiaient tous deux « aucune analyse »).
 */
export default class extends BaseSchema {
  protected tableName = 'exercise_results'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('analyzed_at', { useTz: true }).nullable()
    })

    this.defer(backfillExerciseAnalyses)
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('analyzed_at')
    })
  }
}
