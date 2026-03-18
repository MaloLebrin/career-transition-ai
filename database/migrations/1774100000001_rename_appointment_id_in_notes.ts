import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notes'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('appointment_id', 'support_plan_step_id')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('support_plan_step_id', 'appointment_id')
    })
  }
}
