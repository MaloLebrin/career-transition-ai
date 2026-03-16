import { BaseSchema } from '@adonisjs/lucid/schema'
import { employeeStatusValues } from '../../shared/constants/employee.js'

export default class extends BaseSchema {
  protected tableName = 'employees'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table
        .integer('organization_id')
        .unsigned()
        .notNullable()
        .references('organizations.id')
        .onDelete('RESTRICT')
      table.integer('advisor_id').unsigned().nullable().references('users.id').onDelete('SET NULL')
      table
        .integer('user_id')
        .unsigned()
        .nullable()
        .references('users.id')
        .onDelete('SET NULL')
        .unique()
      table.string('name', 255).notNullable()
      table.string('email', 255).notNullable()
      table.string('current_role', 255).notNullable()
      table.string('target_role', 255).nullable()
      table.text('summary').nullable()
      table.text('advisor_notes').nullable()
      table.string('status', 50).notNullable().defaultTo('active')
      table.boolean('onboarded').notNullable().defaultTo(false)
      table.timestamp('next_appointment', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.timestamp('deleted_at', { useTz: true }).nullable()
    })

    this.schema.raw(`
      ALTER TABLE "${this.tableName}"
      ADD CONSTRAINT "${this.tableName}_status_check"
      CHECK (status IS NULL OR status IN (${employeeStatusValues.map((status) => `'${status}'`).join(',')}))
    `)
  }

  async down() {
    this.schema.raw(
      `ALTER TABLE "${this.tableName}" DROP CONSTRAINT IF EXISTS "${this.tableName}_status_check"`
    )
    this.schema.dropTable(this.tableName)
  }
}
