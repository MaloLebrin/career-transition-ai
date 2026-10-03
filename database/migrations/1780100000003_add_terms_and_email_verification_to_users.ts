import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * #93 — inscription des particuliers : preuve d'acceptation des CGU
 * (`terms_accepted_at` + `terms_version`, cf. `TERMS_VERSION` de
 * `shared/constants/legal.ts`) et date de vérification de l'adresse e-mail
 * (`email_verified_at`, posée par #98). Toutes nullables : les comptes B2B
 * existants, créés sur invitation, n'ont ni l'une ni l'autre.
 */
export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('terms_accepted_at', { useTz: true }).nullable()
      table.string('terms_version', 20).nullable()
      table.timestamp('email_verified_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('email_verified_at')
      table.dropColumn('terms_version')
      table.dropColumn('terms_accepted_at')
    })
  }
}
