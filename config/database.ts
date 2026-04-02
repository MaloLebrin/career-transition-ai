import { resolvePostgresConnection } from '#helpers/postgres_connection_resolve'
import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const postgresConnection = resolvePostgresConnection({
  nodeEnv: env.get('NODE_ENV'),
  dbHost: env.get('DB_HOST'),
  dbPort: env.get('DB_PORT'),
  dbUser: env.get('DB_USER'),
  dbPassword: env.get('DB_PASSWORD'),
  dbDatabase: env.get('DB_DATABASE'),
  addonHost: env.get('POSTGRESQL_ADDON_HOST'),
  addonPort: env.get('POSTGRESQL_ADDON_PORT'),
  addonUser: env.get('POSTGRESQL_ADDON_USER'),
  addonPassword: env.get('POSTGRESQL_ADDON_PASSWORD'),
  addonDb: env.get('POSTGRESQL_ADDON_DB'),
})

const dbConfig = defineConfig({
  connection: env.get('NODE_ENV') === 'test' ? 'sqlite' : 'postgres',
  connections: {
    postgres: {
      client: 'pg',
      connection: {
        host: postgresConnection.host,
        port: postgresConnection.port,
        user: postgresConnection.user,
        password: postgresConnection.password,
        database: postgresConnection.database,
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
    sqlite: {
      client: 'better-sqlite3',
      connection: {
        filename: env.get('SQLITE_DB_PATH', ':memory:'),
      },
      useNullAsDefault: true,
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
})

export default dbConfig
