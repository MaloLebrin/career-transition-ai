import Organization from '#models/organization'
import { SUPER_ADMIN_CREATABLE_ROLES } from '#shared/constants/roles'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { createPlatformUserValidator } from '#validators/super_admin/create_platform_user_validator'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('createPlatformUserValidator', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function payload(role: string) {
    const organization = await Organization.create({ name: 'Cabinet', logoUrl: null })
    return { organizationId: organization.id, name: 'Alice', email: 'alice@cabinet.test', role }
  }

  test('accepte chaque rôle créable par le super admin', async ({ assert }) => {
    for (const role of SUPER_ADMIN_CREATABLE_ROLES) {
      const result = await createPlatformUserValidator.validate(await payload(role))
      assert.equal(result.role, role)
    }
  })

  /** Régression #96 : `employee` créait un `User` sans `Employee`, 401 à la connexion. */
  test('refuse employee, super_admin et un rôle inconnu', async ({ assert }) => {
    for (const role of [USERS_ROLES.EMPLOYEE, USERS_ROLES.SUPER_ADMIN, 'god']) {
      const data = await payload(role)
      await assert.rejects(() => createPlatformUserValidator.validate(data))
    }
  })
})
