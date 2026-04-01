import { BaseSchema } from '@adonisjs/lucid/schema'
import { exerciceResultTypesValues } from '../../app/models/exercise_result.js'

export default class extends BaseSchema {
  protected tableName = 'support_plan_steps'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table
        .integer('employee_id')
        .unsigned()
        .notNullable()
        .references('employees.id')
        .onDelete('CASCADE')
      table.string('title', 255).notNullable()
      table.text('description').nullable()
      table.date('due_date').notNullable()
      table.boolean('completed').notNullable().defaultTo(false)
      table.text('notes').nullable()
      table.string('associated_exercise', 50).nullable()
      table.smallint('sort_order').unsigned().notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    const client = this.db.getWriteClient()
    const isPostgres = client.client?.config?.client === 'pg'
    if (isPostgres) {
      this.schema.raw(`
        ALTER TABLE "${this.tableName}"
        ADD CONSTRAINT "${this.tableName}_associated_exercise_check"
        CHECK (associated_exercise IS NULL OR associated_exercise IN (
          ${exerciceResultTypesValues.map((type) => `'${type}'`).join(',')}))
      `)
    }
  }

  async down() {
    const client = this.db.getWriteClient()
    const isPostgres = client.client?.config?.client === 'pg'
    if (isPostgres) {
      this.schema.raw(
        `ALTER TABLE "${this.tableName}" DROP CONSTRAINT IF EXISTS "${this.tableName}_associated_exercise_check"`
      )
    }
    this.schema.dropTable(this.tableName)
  }
}
