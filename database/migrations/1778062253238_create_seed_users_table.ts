import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Migration volontairement vide (issue #10).
 *
 * Elle créait, en production, des organisations et des comptes en dur avec
 * `ADMIN_PASSWORD` : `migration:run` échouait sans ce secret, et une migration
 * ne doit contenir ni secret ni données personnelles. Le fichier est conservé
 * car il est déjà enregistré dans les bases existantes.
 *
 * Le super admin est créé/mis à jour par `database/seeders/admin_seeder.ts` :
 *   node build/bin/console.js db:seed --files database/seeders/admin_seeder
 * Les autres organisations et comptes se créent depuis l'UI super admin.
 */
export default class extends BaseSchema {
  async up() {}

  async down() {}
}
