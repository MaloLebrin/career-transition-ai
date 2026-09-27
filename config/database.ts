import env from '#start/env'
import { buildPostgresConnection } from '#utils/database_connection'
import { defineConfig } from '@adonisjs/lucid'

/**
 * PostgreSQL partout, tests compris — plus de SQLite en test : les deux
 * moteurs divergent (booléens, JSON, `RETURNING`, contraintes CHECK), et une
 * suite verte sur SQLite ne prouvait rien de la base de production.
 *
 * En test, `.env.test` pointe sur le service `postgres_test` du
 * `docker-compose.yml` (profil `test`, port hôte 5432) — voir docs/TESTING.md.
 */
const dbConfig = defineConfig({
  connection: 'postgres',
  connections: {
    postgres: {
      client: 'pg',
      // `DB_URL` ou le jeu `DB_*` ; `DB_SSL=false` pour un Postgres sans TLS
      // (compose local, base de test). Voir app/utils/database_connection.ts.
      connection: buildPostgresConnection({
        DB_URL: env.get('DB_URL'),
        DB_HOST: env.get('DB_HOST'),
        DB_PORT: env.get('DB_PORT'),
        DB_USER: env.get('DB_USER'),
        DB_PASSWORD: env.get('DB_PASSWORD'),
        DB_DATABASE: env.get('DB_DATABASE'),
        DB_SSL: env.get('DB_SSL'),
      }),
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
})

export default dbConfig
