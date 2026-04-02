import {
  resolvePostgresConnection,
  type ResolvePostgresInput,
} from '#helpers/postgres_connection_resolve'
import { test } from '@japa/runner'

test.group('resolvePostgresConnection', () => {
  test('prefers DB_* over POSTGRESQL_ADDON_* when both are set', ({ assert }) => {
    const input: ResolvePostgresInput = {
      nodeEnv: 'production',
      dbHost: 'db.app.internal',
      dbPort: 5432,
      dbUser: 'app',
      dbPassword: 'secret',
      dbDatabase: 'appdb',
      addonHost: 'addon.example.com',
      addonPort: 5433,
      addonUser: 'addon',
      addonPassword: 'other',
      addonDb: 'otherdb',
    }
    const c = resolvePostgresConnection(input)
    assert.equal(c.host, 'db.app.internal')
    assert.equal(c.port, 5432)
    assert.equal(c.user, 'app')
    assert.equal(c.password, 'secret')
    assert.equal(c.database, 'appdb')
  })

  test('uses POSTGRESQL_ADDON_* when DB_* is absent', ({ assert }) => {
    const c = resolvePostgresConnection({
      nodeEnv: 'production',
      addonHost: 'cc-postgresql.example.net',
      addonPort: 5432,
      addonUser: 'u7xx',
      addonPassword: 'p4ss',
      addonDb: 'b7xx',
    })
    assert.equal(c.host, 'cc-postgresql.example.net')
    assert.equal(c.port, 5432)
    assert.equal(c.user, 'u7xx')
    assert.equal(c.password, 'p4ss')
    assert.equal(c.database, 'b7xx')
  })

  test('allows undefined password when using addon-style config', ({ assert }) => {
    const c = resolvePostgresConnection({
      nodeEnv: 'production',
      addonHost: 'h',
      addonPort: 1,
      addonUser: 'u',
      addonDb: 'd',
    })
    assert.isUndefined(c.password)
  })

  test('throws in production when configuration is incomplete', ({ assert }) => {
    assert.throws(
      () =>
        resolvePostgresConnection({
          nodeEnv: 'production',
          addonHost: 'h',
          // missing port, user, database
        }),
      /PostgreSQL configuration is incomplete/
    )
  })

  test('throws in production when mixing partial DB_* with partial addon (no full set)', ({ assert }) => {
    assert.throws(
      () =>
        resolvePostgresConnection({
          nodeEnv: 'production',
          dbHost: '127.0.0.1',
          dbPort: 5432,
          addonDb: 'only_addon_db',
        }),
      /PostgreSQL configuration is incomplete/
    )
  })

  test('fills placeholders in test mode when values are missing', ({ assert }) => {
    const c = resolvePostgresConnection({ nodeEnv: 'test' })
    assert.equal(c.host, '127.0.0.1')
    assert.equal(c.port, 5432)
    assert.equal(c.user, 'root')
    assert.equal(c.password, 'root')
    assert.equal(c.database, 'app_test_unused')
  })
})
