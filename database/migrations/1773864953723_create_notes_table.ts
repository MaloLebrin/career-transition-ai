import { NOTE_VISIBILITY, noteVisibilityValues } from '#shared/constants/note'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table
        .integer('organization_id')
        .unsigned()
        .notNullable()
        .references('organizations.id')
        .onDelete('RESTRICT')
      table
        .integer('employee_id')
        .unsigned()
        .notNullable()
        .references('employees.id')
        .onDelete('CASCADE')
      table.integer('author_id').unsigned().notNullable().references('users.id').onDelete('CASCADE')
      table
        .integer('appointment_id')
        .unsigned()
        .nullable()
        .references('appointments.id')
        .onDelete('CASCADE')
      table
        .integer('exercise_result_id')
        .unsigned()
        .nullable()
        .references('exercise_results.id')
        .onDelete('CASCADE')
      table.string('visibility', 20).notNullable().defaultTo(NOTE_VISIBILITY.PRIVATE)
      table.text('content').notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.timestamp('deleted_at', { useTz: true }).nullable()
    })

    const client = this.db.getWriteClient()
    const isPostgres = client.client?.config?.client === 'pg'
    if (isPostgres) {
      this.schema.raw(`
        ALTER TABLE "${this.tableName}"
        ADD CONSTRAINT "${this.tableName}_visibility_check"
        CHECK (visibility IN (${noteVisibilityValues.map((v) => `'${v}'`).join(',')}))
      `)
    }
  }

  async down() {
    const client = this.db.getWriteClient()
    const isPostgres = client.client?.config?.client === 'pg'
    if (isPostgres) {
      this.schema.raw(
        `ALTER TABLE "${this.tableName}" DROP CONSTRAINT IF EXISTS "${this.tableName}_visibility_check"`
      )
    }
    this.schema.dropTable(this.tableName)
  }
}
