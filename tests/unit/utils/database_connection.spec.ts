import dbConfig from '#config/database'
import { buildPostgresConnection } from '#utils/database_connection'
import { test } from '@japa/runner'

/**
 * Non-régression de l'issue #9 : boot avec `DB_URL` seul (Neon, Render) et
 * avec le jeu `DB_*` + `DB_SSL=false` (compose local).
 */

const NEON_URL = 'postgres://user:secret@ep-example.eu-central-1.aws.neon.tech/app?sslmode=require'

const KEEPALIVE = { keepAlive: true, keepAliveInitialDelayMillis: 10_000 }

const DISCRETE = {
  DB_HOST: 'postgres',
  DB_PORT: 5432,
  DB_USER: 'cta',
  DB_PASSWORD: 'secret',
  DB_DATABASE: 'cta',
}

test.group('buildPostgresConnection', () => {
  test('DB_URL seul → connectionString, SSL actif par défaut', ({ assert }) => {
    assert.deepEqual(buildPostgresConnection({ DB_URL: NEON_URL }), {
      connectionString: NEON_URL,
      ssl: { rejectUnauthorized: false },
      ...KEEPALIVE,
    })
  })

  test('DB_URL + DB_SSL=false → SSL désactivé', ({ assert }) => {
    assert.deepEqual(buildPostgresConnection({ DB_URL: NEON_URL, DB_SSL: false }), {
      connectionString: NEON_URL,
      ssl: false,
      ...KEEPALIVE,
    })
  })

  test('DB_URL prime sur le jeu DB_* et ne le mélange pas', ({ assert }) => {
    assert.deepEqual(buildPostgresConnection({ DB_URL: NEON_URL, ...DISCRETE }), {
      connectionString: NEON_URL,
      ssl: { rejectUnauthorized: false },
      ...KEEPALIVE,
    })
  })

  test('jeu DB_* + DB_SSL=false → connexion discrète sans TLS (compose)', ({ assert }) => {
    assert.deepEqual(buildPostgresConnection({ ...DISCRETE, DB_SSL: false }), {
      host: 'postgres',
      port: 5432,
      user: 'cta',
      password: 'secret',
      database: 'cta',
      ssl: false,
      ...KEEPALIVE,
    })
  })

  test('jeu DB_* sans DB_SSL → SSL actif par défaut', ({ assert }) => {
    const connection = buildPostgresConnection(DISCRETE)
    assert.deepEqual(connection.ssl, { rejectUnauthorized: false })
  })

  test('DB_PASSWORD reste optionnel', ({ assert }) => {
    const connection = buildPostgresConnection({ ...DISCRETE, DB_PASSWORD: undefined })
    assert.notProperty(connection, 'connectionString')
    assert.isUndefined((connection as { password?: string }).password)
  })

  test('aucun jeu défini → erreur claire', ({ assert }) => {
    assert.throws(
      () => buildPostgresConnection({}),
      /définir DB_URL, ou le jeu complet DB_HOST, DB_PORT, DB_USER, DB_DATABASE \(manquant : DB_HOST, DB_PORT, DB_USER, DB_DATABASE\)/
    )
  })

  test('le pool ne garde pas de connexion idle que Neon couperait', ({ assert }) => {
    const pool = dbConfig.connections.postgres.pool
    assert.equal(pool?.min, 0)
    assert.equal(pool?.idleTimeoutMillis, 20_000)
  })

  test('jeu DB_* partiel → erreur listant les clés manquantes', ({ assert }) => {
    assert.throws(
      () => buildPostgresConnection({ DB_HOST: 'postgres', DB_USER: 'cta', DB_URL: '' }),
      /manquant : DB_PORT, DB_DATABASE\)/
    )
  })
})
