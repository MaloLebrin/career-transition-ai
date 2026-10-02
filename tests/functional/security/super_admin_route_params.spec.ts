import { createSuperAdmin } from '#tests/support/actors'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * Les ids de route du back-office super admin sont contraints par
 * `router.matchers.number()` : un segment non numérique ne matche aucune route (404),
 * sans atteindre le contrôleur.
 */
const PREFIX = '/dashboard/super-admin'

test.group('Super admin — ids de route numériques (functional)', (group) => {
  group.each.setup(() => truncateDb())

  const cases: Array<[string, string]> = [
    ['delete', `${PREFIX}/organizations/abc`],
    ['post', `${PREFIX}/users/abc/role`],
    ['post', `${PREFIX}/users/abc/resend-onboarding`],
    ['post', `${PREFIX}/expert-requests/abc/assign`],
    ['post', `${PREFIX}/expert-requests/abc/decline`],
    ['post', `${PREFIX}/b2c/abc/entitlement/grant`],
    ['post', `${PREFIX}/payments/abc/revoke`],
  ]

  for (const [method, url] of cases) {
    test(`${method.toUpperCase()} ${url} → 404`, async ({ client }) => {
      const admin = await createSuperAdmin()
      const response = await (client as any)[method](url).loginAs(admin).json({}).redirects(0)
      response.assertStatus(404)
    })
  }
})
