import { notificationTypeValues, NOTIFICATION_TYPES } from '../../shared/constants/notifications.js'
import { notificationTypeCheckStatements } from './1791000000000_resync_notifications_type_check.js'
import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Chat candidat ↔ expert : ajoute `chat_message_received` à
 * `notifications_type_check` (liste réécrite depuis `NOTIFICATION_TYPES`).
 */
export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      for (const sql of notificationTypeCheckStatements(notificationTypeValues)) {
        await db.rawQuery(sql)
      }
    })
  }

  async down() {
    const previous = notificationTypeValues.filter(
      (type) => type !== NOTIFICATION_TYPES.CHAT_MESSAGE_RECEIVED
    )
    this.defer(async (db) => {
      for (const sql of notificationTypeCheckStatements(previous)) {
        await db.rawQuery(sql)
      }
    })
  }
}
