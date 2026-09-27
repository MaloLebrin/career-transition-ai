import { APPOINTMENTS_STATUSES, appointmentStatusValues } from '#shared/constants/appointment'
import { BaseSchema } from '@adonisjs/lucid/schema'

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

    const client = this.db.getWriteClient()
    const isPostgres = client.client?.config?.client === 'pg'
    if (isPostgres) {
      this.schema.raw(`
        ALTER TABLE "${this.tableName}"
        ADD CONSTRAINT "${this.tableName}_status_check"
        CHECK (status IS NULL OR status IN (${appointmentStatusValues.map((status) => `'${status}'`).join(',')}))
      `)
    }
  }

  async down() {
    // La table est supprimée par 1774100000000_refactor_support_plan_steps_as_rdv :
    // au rollback complet (teardown des tests), elle n'existe déjà plus. Sur
    // Postgres, `DROP CONSTRAINT IF EXISTS` ne tolère pas une relation absente —
    // d'où le `ALTER TABLE IF EXISTS` et le `dropTableIfExists`.
    const client = this.db.getWriteClient()
    const isPostgres = client.client?.config?.client === 'pg'
    if (isPostgres) {
      this.schema.raw(
        `ALTER TABLE IF EXISTS "${this.tableName}" DROP CONSTRAINT IF EXISTS "${this.tableName}_status_check"`
      )
    }
    this.schema.dropTableIfExists(this.tableName)
  }
}
