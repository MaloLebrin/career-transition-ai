import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Index sur `lower(email)` : la boîte des demandes de contact rapproche demandes, comptes et
 * adresses bloquées sans tenir compte de la casse (`LOWER(email) = …`), ce qu'un index sur la
 * colonne brute ne sert pas.
 */
export default class extends BaseSchema {
  async up() {
    this.schema.raw(
      'CREATE INDEX IF NOT EXISTS contact_requests_email_lower_index ON contact_requests (lower(email))'
    )
    this.schema.raw('CREATE INDEX IF NOT EXISTS users_email_lower_index ON users (lower(email))')
  }

  async down() {
    this.schema.raw('DROP INDEX IF EXISTS users_email_lower_index')
    this.schema.raw('DROP INDEX IF EXISTS contact_requests_email_lower_index')
  }
}
