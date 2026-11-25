import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Adresses e-mail bloquées pour le formulaire de contact public : une demande
 * envoyée depuis l'une d'elles n'est ni enregistrée ni relayée par e-mail.
 * L'adresse est stockée en minuscules (contrainte CHECK) pour une recherche exacte.
 */
export default class extends BaseSchema {
  protected tableName = 'blocked_contact_emails'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('email', 255).notNullable().unique()
      table
        .integer('blocked_by_user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.check('email = lower(email)', [], 'blocked_contact_emails_email_lowercase_check')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
