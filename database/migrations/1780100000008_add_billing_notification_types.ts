import { notificationTypeValues } from '../../shared/constants/notifications.js'
import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * #104 — notifications du particulier quand son forfait est réglé
 * (`results_unlocked`) ou son accès retiré (`results_access_revoked`) :
 * la contrainte CHECK suit `NOTIFICATION_TYPES`.
 */
const PREVIOUS_TYPES = [
  'pdf_export_completed',
  'exercise_completed',
  'ai_synthesis_ready',
  'step_unlocked',
  'appointment_scheduled',
  'synthesis_shared',
  'data_erasure_requested',
  'ai_analysis_ready_candidate',
  'expert_request_created',
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
