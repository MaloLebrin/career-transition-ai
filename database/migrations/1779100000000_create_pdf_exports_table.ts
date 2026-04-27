import { pdfExportStatusValues, PDF_EXPORT_STATUSES } from '../../shared/constants/pdf_export.js'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pdf_exports'

  async up() {
    const client = this.db.getWriteClient()
    const isPostgres = client.client?.config?.client === 'pg'

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

      table
        .integer('employee_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('employees')
        .onDelete('CASCADE')

      table
        .integer('advisor_user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')

      table.string('status', 20).notNullable().defaultTo(PDF_EXPORT_STATUSES.PENDING)
      table.text('error_message').nullable()

      table.text('file_path').nullable()
      table.text('file_name').nullable()
      table.string('mime_type', 100).nullable()
      table.integer('size').unsigned().nullable()

      table.timestamp('started_at', { useTz: true }).nullable()
      table.timestamp('finished_at', { useTz: true }).nullable()

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    if (isPostgres) {
      // Keep DB constraint in sync with TS constants
      const allowed = pdfExportStatusValues.map((s) => `'${s}'`).join(',')
      this.schema.raw(`
        ALTER TABLE "${this.tableName}"
        ADD CONSTRAINT "${this.tableName}_status_check"
        CHECK (status IN (${allowed}))
      `)
    }
  }

  async down() {
    const client = this.db.getWriteClient()
    const isPostgres = client.client?.config?.client === 'pg'

    if (isPostgres) {
      this.schema.raw(`
        ALTER TABLE "${this.tableName}"
        DROP CONSTRAINT IF EXISTS "${this.tableName}_status_check"
      `)
    }
    this.schema.dropTable(this.tableName)
  }
}
