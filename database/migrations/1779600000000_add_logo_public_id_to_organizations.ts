import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Issue #51 : logo d'organisation stocké sur Cloudinary. `logo_url` garde l'URL
 * publique affichée ; `logo_public_id` sert à supprimer l'ancien fichier lors
 * d'un remplacement ou d'une suppression.
 */
export default class extends BaseSchema {
  protected tableName = 'organizations'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('logo_public_id', 255).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('logo_public_id')
    })
  }
}
