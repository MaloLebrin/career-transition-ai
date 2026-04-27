import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'exercise_results'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('progress_percent').nullable()
    })

    const client = this.db.getWriteClient()
    const isPostgres = client.client?.config?.client === 'pg'
    if (!isPostgres) return

    this.schema.raw(`
      ALTER TABLE "${this.tableName}"
      ADD CONSTRAINT "${this.tableName}_progress_percent_check"
      CHECK (
        progress_percent IS NULL
        OR (progress_percent >= 0 AND progress_percent <= 100)
      )
    `)
  }

  async down() {
    const client = this.db.getWriteClient()
    const isPostgres = client.client?.config?.client === 'pg'

    if (isPostgres) {
      this.schema.raw(`
        ALTER TABLE "${this.tableName}"
        DROP CONSTRAINT IF EXISTS "${this.tableName}_progress_percent_check"
      `)
    }

    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('progress_percent')
    })
  }
}
