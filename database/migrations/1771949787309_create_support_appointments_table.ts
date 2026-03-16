import { BaseSchema } from '@adonisjs/lucid/schema'
import { APPOINTMENTS_STATUSES, appointmentStatusValues } from '../../shared/constants/appointment.js'

export default class extends BaseSchema {
  protected tableName = 'appointments'

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
      table.integer('advisor_id').unsigned().nullable().references('users.id').onDelete('SET NULL')
      table.timestamp('scheduled_at', { useTz: true }).notNullable()
      table.timestamp('ended_at', { useTz: true }).nullable()
      table.string('type', 50).nullable()
      table.string('status', 30).notNullable().defaultTo(APPOINTMENTS_STATUSES.SCHEDULED)
      table.text('notes').nullable()
      table.string('location_or_link', 512).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.timestamp('deleted_at', { useTz: true }).nullable()
    })

    this.schema.raw(`
      ALTER TABLE "${this.tableName}"
      ADD CONSTRAINT "${this.tableName}_status_check"
      CHECK (status IS NULL OR status IN (${appointmentStatusValues.map((status) => `'${status}'`).join(',')}))
    `)
  }

  async down() {
    this.schema.raw(
      `ALTER TABLE "${this.tableName}" DROP CONSTRAINT IF EXISTS "${this.tableName}_status_check"`
    )
    this.schema.dropTable(this.tableName)
  }
}
