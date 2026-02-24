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
    // CHECK séparé pour pouvoir le modifier plus tard (ALTER ... DROP CONSTRAINT + ADD CONSTRAINT)
    this.schema.raw(`
      ALTER TABLE "${this.tableName}"
      ADD CONSTRAINT "${this.tableName}_role_check"
      CHECK (role IN ('advisor', 'employee', 'admin'))
    `)
  }

  async down() {
    this.schema.dropTable(this.tableName)
    // pas besoin de DROP CONSTRAINT, dropTable supprime tout
  }
}
/*
// migration: alter_users_role_check_add_admin.ts
this.schema.raw(`
  ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_role_check"
`)
this.schema.raw(`
  ALTER TABLE "users"
  ADD CONSTRAINT "users_role_check"
  CHECK (role IN ('advisor', 'employee', 'admin', 'super_admin'))
`)
*/
