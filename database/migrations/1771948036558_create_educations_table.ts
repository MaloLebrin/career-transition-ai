import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'educations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table
        .integer('employee_id')
        .unsigned()
        .notNullable()
        .references('employees.id')
        .onDelete('CASCADE')
      table.string('degree', 255).notNullable()
      table.string('school', 255).notNullable()
      table.date('start_date').notNullable()
      table.date('end_date').nullable()
      table.boolean('is_current').notNullable().defaultTo(false)
      table.text('description').nullable()
      table.smallint('sort_order').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
