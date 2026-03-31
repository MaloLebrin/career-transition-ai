import { userRolesValues } from '../../shared/types/advisor/roles.js'
import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Synchronise la contrainte CHECK sur `users.role` avec `userRolesValues`
 * (`shared/types/advisor/roles.ts`). Utile si la liste des rôles a évolué après
 * la migration initiale (ex. ajout de `expert`).
 */
export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    const client = this.db.getWriteClient()
    const isPostgres = client.client?.config?.client === 'pg'
    if (!isPostgres) return

    const allowed = userRolesValues.map((role) => `'${role}'`).join(',')

    this.schema.raw(`
      ALTER TABLE "${this.tableName}"
      DROP CONSTRAINT IF EXISTS "${this.tableName}_role_check"
    `)
    this.schema.raw(`
      ALTER TABLE "${this.tableName}"
      ADD CONSTRAINT "${this.tableName}_role_check"
      CHECK (role IN (${allowed}))
    `)
  }

  async down() {
    const client = this.db.getWriteClient()
    const isPostgres = client.client?.config?.client === 'pg'
    if (!isPostgres) return

    /**
     * État avant cette migration : rôles sans `expert` (cf. commentaire historique
     * dans `1771946144495_create_update_users_table.ts`). Échoue si un utilisateur
     * a déjà `role = expert`.
     */
    const previousRoles = ['advisor', 'employee', 'admin', 'super_admin']
    const allowed = previousRoles.map((role) => `'${role}'`).join(',')

    this.schema.raw(`
      ALTER TABLE "${this.tableName}"
      DROP CONSTRAINT IF EXISTS "${this.tableName}_role_check"
    `)
    this.schema.raw(`
      ALTER TABLE "${this.tableName}"
      ADD CONSTRAINT "${this.tableName}_role_check"
      CHECK (role IN (${allowed}))
    `)
  }
}
