import { notificationTypeValues } from '../../shared/constants/notifications.js'
import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * #70 — types de notification du candidat (étape débloquée, rendez-vous,
 * synthèse partagée) et demande d'effacement RGPD : la contrainte CHECK suit
 * `NOTIFICATION_TYPES`.
 */
const PREVIOUS_TYPES = ['pdf_export_completed', 'exercise_completed', 'ai_synthesis_ready']

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
