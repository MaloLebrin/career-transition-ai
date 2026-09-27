import SeedUsersMigration from '#database/migrations/1778062253238_create_seed_users_table'
import Organization from '#models/organization'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

/**
 * Non-régression de l'issue #10 : la migration 1778062253238 ne seed plus de
 * comptes et ne dépend plus d'`ADMIN_PASSWORD` — `migration:run --force`
 * doit passer en production sans ce secret.
 */
test.group('Migration 1778062253238 (ex-seed des comptes)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('up() passe en production sans ADMIN_PASSWORD et ne crée aucun compte', async ({
    assert,
  }) => {
    const prevNodeEnv = process.env.NODE_ENV
    const prevPassword = process.env.ADMIN_PASSWORD
    process.env.NODE_ENV = 'production'
    delete process.env.ADMIN_PASSWORD
    try {
      const usersBefore = await User.query().count('* as total')
      const orgsBefore = await Organization.query().count('* as total')

      const migration = new SeedUsersMigration(db.connection(), 'seed_users', false)
      await assert.doesNotReject(() => migration.execUp())

      const usersAfter = await User.query().count('* as total')
      const orgsAfter = await Organization.query().count('* as total')
      assert.equal(usersAfter[0].$extras.total, usersBefore[0].$extras.total)
      assert.equal(orgsAfter[0].$extras.total, orgsBefore[0].$extras.total)
    } finally {
      process.env.NODE_ENV = prevNodeEnv
      if (prevPassword === undefined) {
        delete process.env.ADMIN_PASSWORD
      } else {
        process.env.ADMIN_PASSWORD = prevPassword
      }
    }
  })
})
