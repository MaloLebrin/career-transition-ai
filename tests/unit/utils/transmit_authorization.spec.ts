import { canSubscribeToOrganizationPdfExports } from '#utils/transmit_authorization'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { test } from '@japa/runner'

test.group('canSubscribeToOrganizationPdfExports', () => {
  test('refuse un invité', ({ assert }) => {
    assert.isFalse(canSubscribeToOrganizationPdfExports(null, '3'))
  })

  test('autorise le super admin', ({ assert }) => {
    assert.isTrue(
      canSubscribeToOrganizationPdfExports(
        { role: USERS_ROLES.SUPER_ADMIN, organizationId: 1 },
        '3'
      )
    )
  })

  test("autorise conseiller, admin et expert de l'organisation", ({ assert }) => {
    for (const role of [USERS_ROLES.ADVISOR, USERS_ROLES.ADMIN, USERS_ROLES.EXPERT]) {
      assert.isTrue(canSubscribeToOrganizationPdfExports({ role, organizationId: 3 }, '3'))
    }
  })

  test("refuse un candidat, même de l'organisation", ({ assert }) => {
    assert.isFalse(
      canSubscribeToOrganizationPdfExports({ role: USERS_ROLES.EMPLOYEE, organizationId: 3 }, '3')
    )
  })

  test('refuse une autre organisation', ({ assert }) => {
    assert.isFalse(
      canSubscribeToOrganizationPdfExports({ role: USERS_ROLES.ADVISOR, organizationId: 4 }, '3')
    )
  })

  test('refuse un utilisateur sans organisation', ({ assert }) => {
    assert.isFalse(
      canSubscribeToOrganizationPdfExports(
        { role: USERS_ROLES.ADVISOR, organizationId: null },
        'NaN'
      )
    )
  })
})
