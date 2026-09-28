import {
  mediaDeliveryTypeValues,
  mediaEntityTypeValues,
  mediaKindValues,
  mediaResourceTypeValues,
} from '../../shared/constants/media.js'
import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Issue #50 : fichiers stockés sur Cloudinary, rattachés à une entité
 * (polymorphe : `entity_type` + `entity_id`, comme dans boat-management).
 * `organization_id` sert au scoping des lectures.
 */
const CHECKS: Record<string, readonly string[]> = {
  entity_type: mediaEntityTypeValues,
  kind: mediaKindValues,
  resource_type: mediaResourceTypeValues,
  delivery_type: mediaDeliveryTypeValues,
}

export default class extends BaseSchema {
  protected tableName = 'media'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('entity_type', 30).notNullable()
      table.integer('entity_id').unsigned().notNullable()
      table
        .integer('organization_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('organizations')
        .onDelete('CASCADE')
      table.string('kind', 30).notNullable()
      table.string('cloudinary_public_id', 255).notNullable().unique()
      table.string('resource_type', 10).notNullable()
      table.string('delivery_type', 20).notNullable()
      table.string('original_filename', 255).notNullable()
      table.string('format', 20).nullable()
      table.integer('bytes').unsigned().notNullable()
      table
        .integer('uploaded_by_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      table.index(['entity_type', 'entity_id'])
      table.index(['organization_id'])
    })

    const client = this.db.getWriteClient()
    if (client.client?.config?.client === 'pg') {
      for (const [column, values] of Object.entries(CHECKS)) {
        this.schema.raw(`
          ALTER TABLE "${this.tableName}"
          ADD CONSTRAINT "${this.tableName}_${column}_check"
          CHECK (${column} IN (${values.map((value) => `'${value}'`).join(',')}))
        `)
      }
    }
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
