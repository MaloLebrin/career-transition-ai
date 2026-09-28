import { SUPER_ADMIN_ASSIGNABLE_ROLES } from '#shared/constants/roles'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { updateUserRoleValidator } from '#validators/super_admin/update_user_role_validator'
import { test } from '@japa/runner'

test.group('updateUserRoleValidator', () => {
  test('accepte chaque rôle attribuable', async ({ assert }) => {
    for (const role of SUPER_ADMIN_ASSIGNABLE_ROLES) {
      const result = await updateUserRoleValidator.validate({ role })
      assert.equal(result.role, role)
    }
  })

  /** Régression #66 : l’ancien validator inline acceptait `super_admin`. */
  test('refuse super_admin et un rôle inconnu', async ({ assert }) => {
    for (const role of [USERS_ROLES.SUPER_ADMIN, 'god', '']) {
      await assert.rejects(() => updateUserRoleValidator.validate({ role }))
    }
  })
})
