import { filesTypesValues } from '#shared/constants/file'
import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Issue #50 : la table `files` n'a jamais été branchée (ni service, ni route) ;
 * elle est remplacée par `media` (Cloudinary). `down()` la recrée à l'identique
 * de `1771950062664_create_files_table`.
 */

export default class extends BaseSchema {
  protected tableName = 'files'

  async up() {
    this.schema.dropTableIfExists(this.tableName)
  }

  async down() {
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

    const client = this.db.getWriteClient()
    const isPostgres = client.client?.config?.client === 'pg'
    if (isPostgres) {
      this.schema.raw(`
        ALTER TABLE "${this.tableName}"
        ADD CONSTRAINT "${this.tableName}_type_check"
        CHECK (type IS NULL OR type IN (${filesTypesValues.map((type) => `'${type}'`).join(',')}))
      `)
    }
  }
}
