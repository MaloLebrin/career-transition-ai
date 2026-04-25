import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'contact_requests'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 255).notNullable()
      table.string('email', 255).notNullable()
      table.string('phone', 50).nullable()
      table.string('organization', 255).nullable()
      table.text('message').notNullable()
      table.string('type', 20).notNullable().defaultTo('contact').checkIn(['contact', 'demo'])
      table
        .string('status', 20)
        .notNullable()
        .defaultTo('pending')
        .checkIn(['pending', 'treated', 'archived'])
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
