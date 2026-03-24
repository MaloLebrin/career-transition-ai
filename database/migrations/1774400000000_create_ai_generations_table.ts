import { BaseSchema } from '@adonisjs/lucid/schema'

/** Valeurs historiques (table retirée ensuite par migration drop) — inline pour ne pas dépendre du code métier. */
const LEGACY_KINDS = [
  'exercise_qualitative',
  'cv_extract',
  'skill_mapping_narrative',
  'targeting_suggestions',
  'skill_mapping_suggestion',
  'challenge_proof',
] as const
const LEGACY_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const

export default class extends BaseSchema {
  protected tableName = 'ai_generations'

  async up() {
    const isPostgres = process.env.NODE_ENV !== 'test'

    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.string('kind', 64).notNullable()
      table.string('status', 32).notNullable().defaultTo('pending')

      if (isPostgres) {
        table.jsonb('input').notNullable()
        table.jsonb('output').nullable()
      } else {
        table.json('input').notNullable()
        table.json('output').nullable()
      }

      table.text('error_message').nullable()

      table.timestamp('started_at', { useTz: true }).nullable()
      table.timestamp('finished_at', { useTz: true }).nullable()

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    if (isPostgres) {
      this.schema.raw(`
        ALTER TABLE "${this.tableName}"
        ADD CONSTRAINT "${this.tableName}_kind_check"
        CHECK (kind IN (${LEGACY_KINDS.map((k) => `'${k}'`).join(',')}))
      `)
      this.schema.raw(`
        ALTER TABLE "${this.tableName}"
        ADD CONSTRAINT "${this.tableName}_status_check"
        CHECK (status IN (${LEGACY_STATUSES.map((s) => `'${s}'`).join(',')}))
      `)
    }
  }

  async down() {
    const isPostgres = process.env.NODE_ENV !== 'test'
    if (isPostgres) {
      this.schema.raw(
        `ALTER TABLE "${this.tableName}" DROP CONSTRAINT IF EXISTS "${this.tableName}_status_check"`
      )
      this.schema.raw(
        `ALTER TABLE "${this.tableName}" DROP CONSTRAINT IF EXISTS "${this.tableName}_kind_check"`
      )
    }
    this.schema.dropTable(this.tableName)
  }
}
