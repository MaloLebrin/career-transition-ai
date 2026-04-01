import AdminSeeder, {
  PLATFORM_ADMIN_EMAIL,
  PLATFORM_ORG_SLUG,
} from '#database/seeders/admin_seeder'
import Organization from '#models/organization'
import User from '#models/user'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

test.group('AdminSeeder', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('throws when ADMIN_PASSWORD is missing', async ({ assert }) => {
    const prev = process.env.ADMIN_PASSWORD
    delete process.env.ADMIN_PASSWORD
    try {
      await assert.rejects(() => new AdminSeeder(db.connection()).run(), /ADMIN_PASSWORD/)
    } finally {
      if (prev === undefined) {
        delete process.env.ADMIN_PASSWORD
      } else {
        process.env.ADMIN_PASSWORD = prev
      }
    }
  })

  test('throws when ADMIN_PASSWORD is only whitespace', async ({ assert }) => {
    const prev = process.env.ADMIN_PASSWORD
    process.env.ADMIN_PASSWORD = '   \t  '
    try {
      await assert.rejects(() => new AdminSeeder(db.connection()).run(), /ADMIN_PASSWORD/)
    } finally {
      if (prev === undefined) {
        delete process.env.ADMIN_PASSWORD
      } else {
        process.env.ADMIN_PASSWORD = prev
      }
    }
  })

  test('second run does not duplicate organization or user', async ({ assert }) => {
    const prev = process.env.ADMIN_PASSWORD
    process.env.ADMIN_PASSWORD = 'test-seed-password-for-admin-seeder-spec'
    try {
      const client = db.connection()
      await new AdminSeeder(client).run()
      await new AdminSeeder(client).run()

      const orgs = await Organization.query().where('slug', PLATFORM_ORG_SLUG)
      assert.lengthOf(orgs, 1)

      const users = await User.query().where('email', PLATFORM_ADMIN_EMAIL)
      assert.lengthOf(users, 1)
      assert.equal(users[0].role, USERS_ROLES.SUPER_ADMIN)
      assert.equal(users[0].organizationId, orgs[0].id)
    } finally {
      if (prev === undefined) {
        delete process.env.ADMIN_PASSWORD
      } else {
        process.env.ADMIN_PASSWORD = prev
      }
    }
  })
})
