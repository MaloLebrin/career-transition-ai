import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Désactivation d'un compte par le super admin (#73) : `disabled_at` renseigné =
 * connexion refusée et sessions en cours coupées, sans supprimer le compte ni ses données.
 */
export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('disabled_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('disabled_at')
    })
  }
}
