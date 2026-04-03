import { BaseSchema } from '@adonisjs/lucid/schema'
import {
  exerciceResultStatusValues,
  exerciceResultStatusValuesValues,
  exerciceResultTypesValues,
} from '../../shared/constants/exercises'

export default class extends BaseSchema {
  protected tableName = 'exercise_results'

  async up() {
    const client = this.db.getWriteClient()
    const isPostgres = client.client?.config?.client === 'pg'
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table
        .integer('employee_id')
        .unsigned()
        .notNullable()
        .references('employees.id')
        .onDelete('CASCADE')
      table.string('type', 30).notNullable()
      table.string('status', 20).notNullable().defaultTo(exerciceResultStatusValues.DRAFT)
      table.date('date').nullable()
      table.integer('duration').unsigned().nullable()
      if (isPostgres) {
        table.jsonb('data').notNullable()
      } else {
        table.json('data').notNullable()
      }
      table.integer('quantitative_score').nullable()
      table.text('qualitative_analysis').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    if (isPostgres) {
      this.schema.raw(`
        ALTER TABLE "${this.tableName}"
        ADD CONSTRAINT "${this.tableName}_type_check"
        CHECK (type IS NULL OR type IN (
          ${exerciceResultTypesValues.map((type) => `'${type}'`).join(',')}))
      `)

      this.schema.raw(`
        ALTER TABLE "${this.tableName}"
        ADD CONSTRAINT "${this.tableName}_status_check"
        CHECK (status IS NULL OR status IN (${exerciceResultStatusValuesValues.map((status) => `'${status}'`).join(',')}))
      `)
    }

    this.schema.raw(`
      CREATE UNIQUE INDEX "${this.tableName}_one_draft_per_employee_type"
      ON "${this.tableName}" (employee_id, type)
      WHERE status = 'draft'
    `)
  }

  async down() {
    const client = this.db.getWriteClient()
    const isPostgres = client.client?.config?.client === 'pg'
    this.schema.raw(`DROP INDEX IF EXISTS "${this.tableName}_one_draft_per_employee_type"`)
    if (isPostgres) {
      this.schema.raw(
        `ALTER TABLE "${this.tableName}" DROP CONSTRAINT IF EXISTS "${this.tableName}_status_check"`
      )
      this.schema.raw(
        `ALTER TABLE "${this.tableName}" DROP CONSTRAINT IF EXISTS "${this.tableName}_type_check"`
      )
    }
    this.schema.dropTable(this.tableName)
  }
}
