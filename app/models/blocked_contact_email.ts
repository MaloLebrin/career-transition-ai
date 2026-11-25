import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

/**
 * Adresse bloquée pour le formulaire de contact public
 * (`#services/contact_blocklist_service`). Toujours en minuscules.
 */
export default class BlockedContactEmail extends BaseModel {
  static table = 'blocked_contact_emails'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare email: string

  /** Super admin qui a bloqué l'adresse ; `null` si son compte a été supprimé. */
  @column()
  declare blockedByUserId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
