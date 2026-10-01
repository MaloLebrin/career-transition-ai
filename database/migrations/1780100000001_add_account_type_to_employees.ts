import { BaseSchema } from '@adonisjs/lucid/schema'
import { ACCOUNT_TYPES, accountTypeValues } from '../../shared/constants/b2c.js'

/**
 * #92 — type de compte d'une fiche candidat (mode B2C, épic #90).
 *
 * `b2b` : candidat invité par un cabinet (existant, valeur par défaut) ;
 * `b2c` : particulier inscrit seul, rattaché à l'organisation plateforme.
 * CHECK séparé, construit depuis `accountTypeValues` (pattern `employees_status_check`).
 */
export default class extends BaseSchema {
  protected tableName = 'employees'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('account_type', 20).notNullable().defaultTo(ACCOUNT_TYPES.B2B)
    })

    const client = this.db.getWriteClient()
    const isPostgres = client.client?.config?.client === 'pg'
    if (isPostgres) {
      this.schema.raw(`
        ALTER TABLE "${this.tableName}"
        ADD CONSTRAINT "${this.tableName}_account_type_check"
        CHECK (account_type IN (${accountTypeValues.map((type) => `'${type}'`).join(',')}))
      `)
    }
  }

  async down() {
    const client = this.db.getWriteClient()
    const isPostgres = client.client?.config?.client === 'pg'
    if (isPostgres) {
      this.schema.raw(
        `ALTER TABLE "${this.tableName}" DROP CONSTRAINT IF EXISTS "${this.tableName}_account_type_check"`
      )
    }
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('account_type')
    })
  }
}
