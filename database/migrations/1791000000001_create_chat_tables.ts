import { BaseSchema } from '@adonisjs/lucid/schema'
import { chatAuthorRoleValues } from '../../shared/constants/chat.js'

/**
 * Chat candidat ↔ expert : une conversation par candidat (`employee_id`
 * unique) et ses messages. Les deux tables disparaissent avec la fiche
 * candidat (`ON DELETE CASCADE`, donc `candidate:purge`). Un auteur supprimé
 * ne peut pas l'être tant qu'il a écrit (`RESTRICT` : les comptes sont
 * désactivés par `deleted_at`, jamais supprimés). Aucune colonne secrète.
 */
export default class extends BaseSchema {
  protected conversations = 'chat_conversations'
  protected messages = 'chat_messages'

  async up() {
    const isPostgres = this.db.getWriteClient().client?.config?.client === 'pg'

    this.schema.createTable(this.conversations, (table) => {
      table.increments('id')
      table
        .integer('employee_id')
        .unsigned()
        .notNullable()
        .unique()
        .references('id')
        .inTable('employees')
        .onDelete('CASCADE')
      table
        .integer('assigned_expert_user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('last_message_at', { useTz: true }).nullable()
      table.timestamp('candidate_last_read_at', { useTz: true }).nullable()
      table.timestamp('expert_last_read_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['assigned_expert_user_id'])
    })

    this.schema.createTable(this.messages, (table) => {
      table.increments('id')
      table
        .integer('conversation_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable(this.conversations)
        .onDelete('CASCADE')
      table
        .integer('author_user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table.string('author_role', 20).notNullable()
      table.text('body').notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['conversation_id', 'id'])
    })

    if (isPostgres) {
      const roles = chatAuthorRoleValues.map((value) => `'${value}'`).join(',')
      this.schema.raw(`
        ALTER TABLE "${this.messages}"
        ADD CONSTRAINT "${this.messages}_author_role_check"
        CHECK (author_role IN (${roles}))
      `)
    }
  }

  async down() {
    const isPostgres = this.db.getWriteClient().client?.config?.client === 'pg'
    if (isPostgres) {
      this.schema.raw(
        `ALTER TABLE "${this.messages}" DROP CONSTRAINT IF EXISTS "${this.messages}_author_role_check"`
      )
    }
    this.schema.dropTable(this.messages)
    this.schema.dropTable(this.conversations)
  }
}
