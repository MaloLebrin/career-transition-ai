import AdminSeeder, {
  PLATFORM_ADMIN_EMAIL,
  PLATFORM_ORG_SLUG,
} from '#database/seeders/admin_seeder'
import Organization from '#models/organization'
import User from '#models/user'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { overrideEnv } from '#tests/utils/env'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

test.group('AdminSeeder', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('throws when ADMIN_PASSWORD is missing', async ({ assert, cleanup }) => {
    cleanup(overrideEnv({ ADMIN_PASSWORD: undefined }))
    await assert.rejects(() => new AdminSeeder(db.connection()).run(), /ADMIN_PASSWORD/)
  })

  test('throws when ADMIN_PASSWORD is only whitespace', async ({ assert, cleanup }) => {
    cleanup(overrideEnv({ ADMIN_PASSWORD: '   \t  ' }))
    await assert.rejects(() => new AdminSeeder(db.connection()).run(), /ADMIN_PASSWORD/)
  })

  test('second run does not duplicate organization or user', async ({ assert, cleanup }) => {
    cleanup(overrideEnv({ ADMIN_PASSWORD: 'test-seed-password-for-admin-seeder-spec' }))
    const client = db.connection()
    await new AdminSeeder(client).run()
    await new AdminSeeder(client).run()

    const orgs = await Organization.query().where('slug', PLATFORM_ORG_SLUG)
    assert.lengthOf(orgs, 1)

    const users = await User.query().where('email', PLATFORM_ADMIN_EMAIL)
    assert.lengthOf(users, 1)
    assert.equal(users[0].role, USERS_ROLES.SUPER_ADMIN)
    assert.equal(users[0].organizationId, orgs[0].id)
  })

  test('a new ADMIN_PASSWORD rotates the super admin password', async ({ assert, cleanup }) => {
    const client = db.connection()
    cleanup(overrideEnv({ ADMIN_PASSWORD: 'first-admin-seeder-password' }))
    await new AdminSeeder(client).run()
    // Le cleanup ci-dessus restaure la valeur d'origine
    overrideEnv({ ADMIN_PASSWORD: 'rotated-admin-seeder-password' })
    await new AdminSeeder(client).run()

    const user = await User.findByOrFail('email', PLATFORM_ADMIN_EMAIL)
    assert.isTrue(await hash.verify(user.password, 'rotated-admin-seeder-password'))
    assert.isFalse(await hash.verify(user.password, 'first-admin-seeder-password'))
  })

  test('ADMIN_EMAIL remplace l’e-mail par défaut du super admin', async ({ assert, cleanup }) => {
    cleanup(
      overrideEnv({
        ADMIN_PASSWORD: 'admin-email-override-password',
        ADMIN_EMAIL: ' Testeur@Example.test ',
      })
    )
    await new AdminSeeder(db.connection()).run()

    const user = await User.findByOrFail('email', 'testeur@example.test')
    assert.equal(user.role, USERS_ROLES.SUPER_ADMIN)
    assert.isNull(await User.findBy('email', PLATFORM_ADMIN_EMAIL))
  })
})
