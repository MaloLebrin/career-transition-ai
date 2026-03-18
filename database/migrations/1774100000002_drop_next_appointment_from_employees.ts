import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'employees'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('next_appointment')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('next_appointment', { useTz: true }).nullable()
    })
  }
}
