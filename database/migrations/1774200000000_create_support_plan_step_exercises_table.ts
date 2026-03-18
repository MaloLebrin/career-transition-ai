import { BaseSchema } from '@adonisjs/lucid/schema'
import { exerciceResultTypesValues } from '../../shared/constants/exercises.js'

export default class extends BaseSchema {
  protected tableName = 'support_plan_step_exercises'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table
        .integer('support_plan_step_id')
        .unsigned()
        .notNullable()
        .references('support_plan_steps.id')
        .onDelete('CASCADE')
      table.string('exercise_type', 50).notNullable()
      table.integer('sort_order').unsigned().nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      table.unique(['support_plan_step_id', 'exercise_type'])
    })

    const isPostgres = process.env.NODE_ENV !== 'test'
    if (isPostgres) {
      this.schema.raw(`
        ALTER TABLE "${this.tableName}"
        ADD CONSTRAINT "${this.tableName}_exercise_type_check"
        CHECK (exercise_type IN (${exerciceResultTypesValues.map((t) => `'${t}'`).join(',')}))
      `)
    }

    this.defer(async (db) => {
      const existingSteps = await db
        .from('support_plan_steps')
        .whereNotNull('associated_exercise')
        .select('id', 'associated_exercise')

      for (const step of existingSteps) {
        await db.table(this.tableName).insert({
          support_plan_step_id: step.id,
          exercise_type: step.associated_exercise,
          sort_order: 0,
          created_at: new Date(),
          updated_at: new Date(),
        })
      }
    })
  }

  async down() {
    const isPostgres = process.env.NODE_ENV !== 'test'
    if (isPostgres) {
      this.schema.raw(
        `ALTER TABLE "${this.tableName}" DROP CONSTRAINT IF EXISTS "${this.tableName}_exercise_type_check"`
      )
    }
    this.schema.dropTable(this.tableName)
  }
}
