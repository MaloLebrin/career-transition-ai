import { BaseSchema } from '@adonisjs/lucid/schema'
import { PLATFORM_ORGANIZATION_SLUG } from '../../shared/constants/organisation.js'

/**
 * #92 — organisation plateforme explicite (mode B2C, épic #90).
 *
 * Jusqu'ici l'organisation interne était identifiée par le `organization_id`
 * du super admin connecté. `is_platform` la rend explicite ; un index unique
 * partiel garantit qu'il n'y en a qu'une. L'organisation seedée
 * (`admin_seeder.ts`, slug `ai-transition-carriere`) est marquée au passage.
 */
export default class extends BaseSchema {
  protected tableName = 'organizations'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_platform').notNullable().defaultTo(false)
    })

    const client = this.db.getWriteClient()
    const isPostgres = client.client?.config?.client === 'pg'
    if (isPostgres) {
      this.schema.raw(`
        CREATE UNIQUE INDEX "${this.tableName}_single_platform_unique"
        ON "${this.tableName}" (is_platform)
        WHERE is_platform
      `)
    }

    this.defer(async (db) => {
      await db.from(this.tableName).where('slug', PLATFORM_ORGANIZATION_SLUG).update({
        is_platform: true,
      })
    })
  }

  async down() {
    const client = this.db.getWriteClient()
    const isPostgres = client.client?.config?.client === 'pg'
    if (isPostgres) {
      this.schema.raw(`DROP INDEX IF EXISTS "${this.tableName}_single_platform_unique"`)
    }
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('is_platform')
    })
  }
}
