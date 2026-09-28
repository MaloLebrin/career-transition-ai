import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * #65 — `onboarding_tokens.token` ne stocke plus le secret du lien mais son
 * empreinte SHA-256 en hexadécimal (64 caractères : la colonne et son index
 * unique conviennent). Les jetons existants sont hachés sur place : les liens
 * déjà envoyés restent valides.
 */
export default class extends BaseSchema {
  protected tableName = 'onboarding_tokens'

  async up() {
    this.defer(async (db) => {
      await db.rawQuery(
        `UPDATE ${this.tableName} SET token = encode(sha256(convert_to(token, 'UTF8')), 'hex')`
      )
    })
  }

  /**
   * Une empreinte ne se réinverse pas : les jetons encore utilisables sont
   * invalidés (il faudra renvoyer les invitations en attente).
   */
  async down() {
    this.defer(async (db) => {
      await db.rawQuery(`UPDATE ${this.tableName} SET used_at = now() WHERE used_at IS NULL`)
    })
  }
}
