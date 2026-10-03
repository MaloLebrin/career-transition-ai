import { BaseSchema } from '@adonisjs/lucid/schema'
import {
  EXPERT_REQUEST_STATUSES,
  expertRequestStatusValues,
} from '../../shared/constants/expert_request.js'

/**
 * #103 — demandes d'accompagnement par un expert (épic B2C #90).
 *
 * `employee_id` en CASCADE : le message libre du candidat disparaît avec sa
 * fiche (`candidate:purge`). Une seule demande `pending` par candidat (index
 * unique partiel). Aucune colonne `key|token|secret|hash`.
 */
export default class extends BaseSchema {
  protected tableName = 'expert_requests'

  async up() {
    const client = this.db.getWriteClient()
    const isPostgres = client.client?.config?.client === 'pg'

    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('employee_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('employees')
        .onDelete('CASCADE')
      table
        .integer('organization_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('organizations')
        .onDelete('RESTRICT')

      table.text('message').notNullable()
      table.text('availability').nullable()
      table.string('status', 20).notNullable().defaultTo(EXPERT_REQUEST_STATUSES.PENDING)

      table
        .integer('handled_by_user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table
        .integer('assigned_expert_user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('handled_at', { useTz: true }).nullable()
      table.string('decline_reason', 500).nullable()

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['organization_id', 'status'])
    })

    if (isPostgres) {
      const quote = (values: readonly string[]) => values.map((v) => `'${v}'`).join(',')
      this.schema.raw(`
        ALTER TABLE "${this.tableName}"
        ADD CONSTRAINT "${this.tableName}_status_check"
        CHECK (status IN (${quote(expertRequestStatusValues)}))
      `)
      this.schema.raw(`
        CREATE UNIQUE INDEX "${this.tableName}_one_pending_per_employee"
        ON "${this.tableName}" (employee_id)
        WHERE status = '${EXPERT_REQUEST_STATUSES.PENDING}'
      `)
    }
  }

  async down() {
    const client = this.db.getWriteClient()
    const isPostgres = client.client?.config?.client === 'pg'

    if (isPostgres) {
      this.schema.raw(`DROP INDEX IF EXISTS "${this.tableName}_one_pending_per_employee"`)
      this.schema.raw(
        `ALTER TABLE "${this.tableName}" DROP CONSTRAINT IF EXISTS "${this.tableName}_status_check"`
      )
    }

    this.schema.dropTable(this.tableName)
  }
}
