import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'bulk_jobs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table
        .integer('organization_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('organizations')
        .onDelete('CASCADE')

      table.string('type', 50).notNullable() // emails, pdfs, mixed...
      table.string('scope', 50).notNullable() // single, batch, org, etc.

      table.string('status', 20).notNullable().defaultTo('pending')

      table.string('queue_job_id').nullable()

      table.text('error_message').nullable()

      table.jsonb('meta').nullable() // filtres, paramètres, chemin fichier, etc.

      table.timestamp('started_at', { useTz: true }).nullable()
      table.timestamp('finished_at', { useTz: true }).nullable()

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  async down() {
    await this.db.rawQuery(`DROP TABLE IF EXISTS "${this.tableName}"`)
  }
}
