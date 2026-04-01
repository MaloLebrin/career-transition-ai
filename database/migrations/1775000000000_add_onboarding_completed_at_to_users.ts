import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('onboarding_completed_at', { useTz: true }).nullable()
    })

    this.defer(async (db) => {
      await db.rawQuery(`
        UPDATE users SET onboarding_completed_at = (
          SELECT MIN(t.used_at) FROM onboarding_tokens t
          WHERE t.user_id = users.id AND t.used_at IS NOT NULL
        )
        WHERE EXISTS (
          SELECT 1 FROM onboarding_tokens t2
          WHERE t2.user_id = users.id AND t2.used_at IS NOT NULL
        )
      `)
      await db.rawQuery(`
        UPDATE users SET onboarding_completed_at = created_at
        WHERE onboarding_completed_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM onboarding_tokens t WHERE t.user_id = users.id)
      `)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('onboarding_completed_at')
    })
  }
}
