import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * #68 — jetons « mot de passe oublié ». Comme `onboarding_tokens` depuis #65,
 * `token` ne stocke que l'empreinte SHA-256 (hex, 64 caractères) du secret
 * envoyé par e-mail. Supprimés en cascade avec le compte.
 */
export default class extends BaseSchema {
  protected tableName = 'password_reset_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('user_id').unsigned().notNullable().references('users.id').onDelete('CASCADE')
      table.string('token', 64).notNullable().unique()
      table.timestamp('expires_at', { useTz: true }).notNullable()
      table.timestamp('used_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.index(['user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
