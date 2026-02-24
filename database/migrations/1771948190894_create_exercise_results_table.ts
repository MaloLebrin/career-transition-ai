import { BaseSchema } from '@adonisjs/lucid/schema'
import { exerciceResultTypesValues } from '../../app/models/exercice_result.js'

export default class extends BaseSchema {
  protected tableName = 'exercise_results'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table
        .integer('employee_id')
        .unsigned()
        .notNullable()
        .references('employees.id')
        .onDelete('CASCADE')
      table.string('type', 50).notNullable()
      table.date('date').notNullable()
      table.integer('duration').notNullable()
      table.jsonb('data').notNullable()
      table.integer('quantitative_score').notNullable()
      table.text('qualitative_analysis').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    this.schema.raw(`
      ALTER TABLE "${this.tableName}"
      ADD CONSTRAINT "${this.tableName}_type_check"
      CHECK (type IS NULL OR type IN (${exerciceResultTypesValues.map((type) => `'${type}'`).join(',')}))
    `)
  }

  async down() {
    this.schema.raw(
      `ALTER TABLE "${this.tableName}" DROP CONSTRAINT IF EXISTS "${this.tableName}_type_check"`
    )
    this.schema.dropTable(this.tableName)
  }
}
