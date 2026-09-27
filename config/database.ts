import env from '#start/env'
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
      connection: {
        host: env.get('DB_HOST'),
        port: env.get('DB_PORT'),
        user: env.get('DB_USER'),
        password: env.get('DB_PASSWORD'),
        database: env.get('DB_DATABASE'),
        connectionString: env.get('DB_URL'),
        // Le Postgres de test (compose local, service GitHub Actions) ne parle
        // pas TLS ; hors test, on conserve le réglage historique.
        ssl: env.get('NODE_ENV') === 'test' ? false : { rejectUnauthorized: false },
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
})

export default dbConfig
