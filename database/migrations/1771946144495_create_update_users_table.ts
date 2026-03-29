import { userRolesValues } from '../../shared/types/advisor/roles.js'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table
        .integer('organization_id')
        .unsigned()
        .notNullable()
        .references('organizations.id')
        .onDelete('RESTRICT')
      table.string('email', 255).notNullable()
      table.string('password', 255).notNullable()
      table.string('name', 255).notNullable()
      table.string('role', 50).notNullable() // longueur 50 pour de futurs rôles
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.timestamp('deleted_at', { useTz: true }).nullable()
      table.unique(['organization_id', 'email'])
    })
    const isPostgres = process.env.NODE_ENV !== 'test'
    if (isPostgres) {
      // CHECK séparé pour pouvoir le modifier plus tard (ALTER ... DROP CONSTRAINT + ADD CONSTRAINT)
      this.schema.raw(`
        ALTER TABLE "${this.tableName}"
        ADD CONSTRAINT "${this.tableName}_role_check"
        CHECK (role IN (${userRolesValues.map((role) => `'${role}'`).join(',')}))
      `)
    }
  }

  async down() {
    this.schema.dropTable(this.tableName)
    // pas besoin de DROP CONSTRAINT, dropTable supprime tout
  }
}
