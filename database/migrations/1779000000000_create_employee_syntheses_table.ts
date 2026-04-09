import { BaseSchema } from '@adonisjs/lucid/schema'
import { employeeSynthesisShareStatusValues } from '#models/employee_synthesis'

export default class extends BaseSchema {
  protected tableName = 'employee_syntheses'

  async up() {
    const client = this.db.getWriteClient()
    const isPostgres = client.client?.config?.client === 'pg'

    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table
        .integer('organization_id')
        .unsigned()
        .notNullable()
        .references('organizations.id')
        .onDelete('CASCADE')

      table
        .integer('employee_id')
        .unsigned()
        .notNullable()
        .references('employees.id')
        .onDelete('CASCADE')

      table.string('share_status', 20).notNullable().defaultTo('draft')
      table.timestamp('shared_at', { useTz: true }).nullable()
      table
        .integer('shared_by_user_id')
        .unsigned()
        .nullable()
        .references('users.id')
        .onDelete('SET NULL')

      table.text('expert_comments_shared').nullable()
      table.text('expert_notes_internal').nullable()
      table.text('executive_summary_override').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      table.unique(['organization_id', 'employee_id'])
    })

    if (isPostgres) {
      this.schema.raw(`
        ALTER TABLE "${this.tableName}"
        ADD CONSTRAINT "${this.tableName}_share_status_check"
        CHECK (
          share_status IS NULL
          OR share_status IN (${employeeSynthesisShareStatusValues.map((s) => `'${s}'`).join(',')})
        )
      `)
    }
  }

  async down() {
    const client = this.db.getWriteClient()
    const isPostgres = client.client?.config?.client === 'pg'

    if (isPostgres) {
      this.schema.raw(
        `ALTER TABLE "${this.tableName}" DROP CONSTRAINT IF EXISTS "${this.tableName}_share_status_check"`
      )
    }

    this.schema.dropTable(this.tableName)
  }
}

