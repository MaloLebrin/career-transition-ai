import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Issue #21 : `pdf_exports.file_path` contient désormais une clé relative au
 * disque Drive (`exports/…`). Les anciens chemins absolus (`<cwd>/tmp/exports`
 * du worker) ne sont plus lisibles : on les efface, l'export reste listé sans
 * lien de téléchargement et peut être régénéré.
 */
export default class extends BaseSchema {
  protected tableName = 'pdf_exports'

  async up() {
    this.defer(async (db) => {
      await db
        .from(this.tableName)
        .whereNotNull('file_path')
        .whereNot('file_path', 'like', 'exports/%')
        .update({ file_path: null })
    })
  }

  async down() {
    // Irréversible : les chemins absolus effacés ne sont pas recréés.
  }
}
