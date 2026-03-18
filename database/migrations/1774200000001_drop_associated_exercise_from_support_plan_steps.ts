import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'support_plan_steps'

  async up() {
    const isPostgres = process.env.NODE_ENV !== 'test'
    if (isPostgres) {
      this.schema.raw(
        `ALTER TABLE "${this.tableName}" DROP CONSTRAINT IF EXISTS "${this.tableName}_associated_exercise_check"`
      )
    }

    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('associated_exercise')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('associated_exercise', 50).nullable()
    })
  }
}
