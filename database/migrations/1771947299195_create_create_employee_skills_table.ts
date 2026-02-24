import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'employee_skills'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table
        .integer('employee_id')
        .unsigned()
        .notNullable()
        .references('employees.id')
        .onDelete('CASCADE')
      table.integer('skill_id').unsigned().notNullable().references('skills.id').onDelete('CASCADE')
      table.smallint('level').unsigned().notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.unique(['employee_id', 'skill_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
