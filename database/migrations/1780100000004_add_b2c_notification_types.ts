import { notificationTypeValues } from '../../shared/constants/notifications.js'
import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * #100 — notification du particulier B2C quand l'analyse IA d'un exercice est
 * prête (`ai_analysis_ready_candidate`) : la contrainte CHECK suit
 * `NOTIFICATION_TYPES`.
 */
const PREVIOUS_TYPES = [
  'pdf_export_completed',
  'exercise_completed',
  'ai_synthesis_ready',
  'step_unlocked',
  'appointment_scheduled',
  'synthesis_shared',
  'data_erasure_requested',
]

export default class extends BaseSchema {
  protected tableName = 'notifications'

  private replaceTypeCheck(values: readonly string[]) {
    const allowed = values.map((t) => `'${t}'`).join(',')
    this.schema.raw(
      `ALTER TABLE "${this.tableName}" DROP CONSTRAINT IF EXISTS "${this.tableName}_type_check"`
    )
    this.schema.raw(`
      ALTER TABLE "${this.tableName}"
      ADD CONSTRAINT "${this.tableName}_type_check"
      CHECK (type IN (${allowed}))
    `)
  }

  async up() {
    this.replaceTypeCheck(notificationTypeValues)
  }

  async down() {
    this.defer(async (db) => {
      await db.from(this.tableName).whereNotIn('type', PREVIOUS_TYPES).delete()
    })
    this.replaceTypeCheck(PREVIOUS_TYPES)
  }
}
