import { experiencesTypesValues } from '#shared/constants/experience'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'experiences'

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
      table.string('company', 255).notNullable()
      table.string('type', 30).nullable()
      table.date('start_date').notNullable()
      table.date('end_date').nullable()
      table.boolean('is_current').notNullable().defaultTo(false)
      table.text('description').nullable()
      table.smallint('sort_order').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    const isPostgres = process.env.NODE_ENV !== 'test'
    if (isPostgres) {
      this.schema.raw(`
        ALTER TABLE "${this.tableName}"
        ADD CONSTRAINT "${this.tableName}_type_check"
        CHECK (type IS NULL OR type IN (${experiencesTypesValues.map((type) => `'${type}'`).join(',')}))
      `)
    }
  }

  async down() {
    const isPostgres = process.env.NODE_ENV !== 'test'
    if (isPostgres) {
      this.schema.raw(
        `ALTER TABLE "${this.tableName}" DROP CONSTRAINT IF EXISTS "${this.tableName}_type_check"`
      )
    }
    this.schema.dropTable(this.tableName)
  }
}
