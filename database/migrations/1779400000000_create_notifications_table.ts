import {
  notificationStatusValues,
  notificationTypeValues,
  NOTIFICATION_STATUSES,
} from '../../shared/constants/notifications.js'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notifications'

  async up() {
    const client = this.db.getWriteClient()
    const isPostgres = client.client?.config?.client === 'pg'

    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.string('type', 60).notNullable()
      table.string('status', 10).notNullable().defaultTo(NOTIFICATION_STATUSES.UNREAD)
      table.string('title', 255).notNullable()
      table.text('body').nullable()

      if (isPostgres) {
        table.jsonb('meta').nullable()
      } else {
        table.json('meta').nullable()
      }

      table.timestamp('read_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['user_id', 'status'])
      table.index(['user_id', 'created_at'])
    })

    if (isPostgres) {
      const allowedTypes = notificationTypeValues.map((t) => `'${t}'`).join(',')
      this.schema.raw(`
        ALTER TABLE "${this.tableName}"
        ADD CONSTRAINT "${this.tableName}_type_check"
        CHECK (type IN (${allowedTypes}))
      `)

      const allowedStatuses = notificationStatusValues.map((s) => `'${s}'`).join(',')
      this.schema.raw(`
        ALTER TABLE "${this.tableName}"
        ADD CONSTRAINT "${this.tableName}_status_check"
        CHECK (status IN (${allowedStatuses}))
      `)
    }
  }

  async down() {
    const client = this.db.getWriteClient()
    const isPostgres = client.client?.config?.client === 'pg'

    if (isPostgres) {
      this.schema.raw(
        `ALTER TABLE "${this.tableName}" DROP CONSTRAINT IF EXISTS "${this.tableName}_type_check"`
      )
      this.schema.raw(
        `ALTER TABLE "${this.tableName}" DROP CONSTRAINT IF EXISTS "${this.tableName}_status_check"`
      )
    }

    this.schema.dropTable(this.tableName)
  }
}
