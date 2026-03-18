import { BaseSchema } from '@adonisjs/lucid/schema'
import { APPOINTMENTS_STATUSES, appointmentStatusValues } from '../../shared/constants/appointment.js'

export default class extends BaseSchema {
  protected tableName = 'support_plan_steps'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('advisor_id').unsigned().nullable().references('users.id').onDelete('SET NULL')
      table.text('instructions').nullable()
      table.timestamp('scheduled_at', { useTz: true }).nullable()
      table.timestamp('ended_at', { useTz: true }).nullable()
      table.string('status', 30).notNullable().defaultTo(APPOINTMENTS_STATUSES.SCHEDULED)
      table.string('location_or_link', 512).nullable()
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.string('title', 255).nullable().alter()
      table.date('due_date').nullable().alter()
    })

    const isPostgres = process.env.NODE_ENV !== 'test'
    if (isPostgres) {
      this.schema.raw(`
        ALTER TABLE "${this.tableName}"
        ADD CONSTRAINT "${this.tableName}_status_check"
        CHECK (status IS NULL OR status IN (${appointmentStatusValues.map((s) => `'${s}'`).join(',')}))
      `)
    }

    this.defer(async (db) => {
      const isPostgres = process.env.NODE_ENV !== 'test'
      if (isPostgres) {
        await db.rawQuery(
          `ALTER TABLE "appointments" DROP CONSTRAINT IF EXISTS "appointments_status_check"`
        )
        await db.rawQuery(`DROP TABLE IF EXISTS "appointments" CASCADE`)
      }
    })
  }

  async down() {
    const isPostgres = process.env.NODE_ENV !== 'test'
    if (isPostgres) {
      this.schema.raw(
        `ALTER TABLE "${this.tableName}" DROP CONSTRAINT IF EXISTS "${this.tableName}_status_check"`
      )
    }

    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('advisor_id')
      table.dropColumn('instructions')
      table.dropColumn('scheduled_at')
      table.dropColumn('ended_at')
      table.dropColumn('status')
      table.dropColumn('location_or_link')
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.string('title', 255).notNullable().alter()
      table.date('due_date').notNullable().alter()
    })
  }
}
