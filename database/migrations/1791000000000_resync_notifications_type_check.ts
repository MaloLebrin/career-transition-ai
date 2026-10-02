import { notificationTypeValues } from '../../shared/constants/notifications.js'
import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Réécrit `notifications_type_check` depuis `NOTIFICATION_TYPES`.
 *
 * En prod la contrainte date encore des 3 types d'origine : insérer
 * `step_unlocked` ou `appointment_scheduled` lève 23514 et la requête
 * (déverrouiller une étape, planifier un rendez-vous) répond 500.
 * `defer` + `rawQuery` exécute le SQL dans la transaction de migration.
 */
export function notificationTypeCheckStatements(values: readonly string[]): [string, string] {
  const allowed = values.map((type) => `'${type}'`).join(',')
  return [
    `ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_type_check"`,
    `ALTER TABLE "notifications" ADD CONSTRAINT "notifications_type_check" CHECK (type IN (${allowed}))`,
  ]
}

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      for (const sql of notificationTypeCheckStatements(notificationTypeValues)) {
        await db.rawQuery(sql)
      }
    })
  }

  /**
   * Le code applicatif insère ces types : revenir à la liste d'origine
   * reproduirait le 500. Le rollback réapplique la même contrainte.
   */
  async down() {
    this.defer(async (db) => {
      for (const sql of notificationTypeCheckStatements(notificationTypeValues)) {
        await db.rawQuery(sql)
      }
    })
  }
}
