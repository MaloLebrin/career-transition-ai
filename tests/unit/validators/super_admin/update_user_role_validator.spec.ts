import { SUPER_ADMIN_CREATABLE_ROLES } from '#shared/constants/roles'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { updateUserRoleValidator } from '#validators/super_admin/update_user_role_validator'
import { test } from '@japa/runner'

test.group('updateUserRoleValidator', () => {
  test('accepte chaque rôle attribuable', async ({ assert }) => {
    for (const role of SUPER_ADMIN_CREATABLE_ROLES) {
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

  /** Régression #96 : un compte `employee` sans fiche candidat est inutilisable (401 à la connexion). */
  test('refuse employee', async ({ assert }) => {
    await assert.rejects(() => updateUserRoleValidator.validate({ role: USERS_ROLES.EMPLOYEE }))
  })
})
