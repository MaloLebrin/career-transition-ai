import { BaseSchema } from '@adonisjs/lucid/schema'
import { filesTypesValues } from '../../app/models/file.js'

export default class extends BaseSchema {
  protected tableName = 'files'

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
      table.string('type', 50).notNullable()
      table.string('name', 255).notNullable()
      table.string('path', 512).notNullable()
      table.string('mime_type', 100).nullable()
      table.integer('size').unsigned().nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.timestamp('deleted_at', { useTz: true }).nullable()
    })

    this.schema.raw(`
      ALTER TABLE "${this.tableName}"
      ADD CONSTRAINT "${this.tableName}_type_check"
      CHECK (type IS NULL OR type IN (${filesTypesValues.map((type) => `'${type}'`).join(',')}))
    `)
  }

  async down() {
    this.schema.raw(
      `ALTER TABLE "${this.tableName}" DROP CONSTRAINT IF EXISTS "${this.tableName}_type_check"`
    )
    this.schema.dropTable(this.tableName)
  }
}
