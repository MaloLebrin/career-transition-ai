import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Store `database` du rate limiting (#172, `config/limiter.ts`) : compteurs
 * partagés entre instances web et conservés au redémarrage. Schéma du stub de
 * `@adonisjs/limiter` (clé `<limiteur>:<clé>`, points consommés, expiration en
 * millisecondes epoch).
 */
export default class extends BaseSchema {
  protected tableName = 'rate_limits'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('key', 255).notNullable().primary()
      table.integer('points', 9).notNullable().defaultTo(0)
      table.bigint('expire').unsigned()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
