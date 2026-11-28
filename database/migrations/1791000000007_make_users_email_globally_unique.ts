import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Unicité globale et insensible à la casse de `users.email` (#169).
 *
 * La connexion et le mot de passe oublié cherchent un compte sur toute la base,
 * alors que l'unicité n'était garantie que par organisation
 * (`unique(organization_id, email)`) : deux cabinets pouvaient inviter la même
 * adresse, et l'un des comptes ne se connectait plus ou recevait le lien de
 * réinitialisation de l'autre. L'index unique `users (lower(email))` remplace
 * la contrainte composite et l'index non unique `users_email_lower_index`
 * (1791000000005), qu'il rend redondant.
 *
 * Aucun dédoublonnage automatique : s'il existe déjà des adresses en double
 * (casse comprise), la migration échoue et liste les ids concernés — à
 * traiter à la main (requête de détection dans `docs/PRODUCTION_CHECKLIST.md`).
 */
export const DUPLICATE_USER_EMAILS_QUERY = `
  SELECT lower(email) AS email, array_agg(id ORDER BY id) AS user_ids
  FROM users
  GROUP BY lower(email)
  HAVING count(*) > 1
`

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.defer(async (db) => {
      const result = await db.rawQuery(DUPLICATE_USER_EMAILS_QUERY)
      const rows = result.rows as Array<{ user_ids: number[] }>
      if (rows.length > 0) {
        const groups = rows.map((row) => `[${row.user_ids.join(', ')}]`).join(' ; ')
        throw new Error(
          `Migration interrompue : ${rows.length} adresse(s) e-mail utilisée(s) par plusieurs comptes ` +
            `(sans tenir compte de la casse). Ids des comptes par adresse : ${groups}. ` +
            'Dédoublonnez-les à la main avant de relancer (voir docs/PRODUCTION_CHECKLIST.md).'
        )
      }
    })
    this.schema.raw('CREATE UNIQUE INDEX users_email_lower_unique ON users (lower(email))')
    this.schema.raw('DROP INDEX IF EXISTS users_email_lower_index')
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['organization_id', 'email'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.unique(['organization_id', 'email'])
    })
    this.schema.raw('CREATE INDEX IF NOT EXISTS users_email_lower_index ON users (lower(email))')
    this.schema.raw('DROP INDEX IF EXISTS users_email_lower_unique')
  }
}
