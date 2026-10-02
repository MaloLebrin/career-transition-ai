import CandidatePayment from '#models/candidate_payment'
import {
  createAdmin,
  createAdvisor,
  createB2cCandidate,
  createSuperAdmin,
} from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * Accueil super admin (GET /dashboard/super-admin) et design system.
 */
test.group('Super admin — accueil', (group) => {
  group.each.setup(() => truncateDb())

  test('affiche les compteurs globaux de la plateforme', async ({ client, assert }) => {
    const superAdmin = await createSuperAdmin()
    await createAdvisor()
    await createAdmin()

    const response = await client.get('/dashboard/super-admin').loginAs(superAdmin).withInertia()

    const props = assertPage(assert, response, 'dashboard/admin/home/Home', ['stats'])
    // 3 organisations (une par acteur), 3 utilisateurs ; aucun particulier (#107)
    assert.deepEqual(props.stats, {
      organizations: 3,
      users: 3,
      b2c: {
        candidates: 0,
        paid: 0,
        monthRevenueCents: 0,
        currency: 'eur',
        pendingExpertRequests: 0,
      },
    })
  })

  test('compte les particuliers, les forfaits réglés et le chiffre d’affaires du mois (#107)', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const paid = await createB2cCandidate({ paid: true })
    await createB2cCandidate()

    const response = await client.get('/dashboard/super-admin').loginAs(superAdmin).withInertia()

    const stats = assertPage(assert, response, 'dashboard/admin/home/Home').stats as {
      b2c: { candidates: number; paid: number; monthRevenueCents: number }
    }
    assert.equal(stats.b2c.candidates, 2)
    assert.equal(stats.b2c.paid, 1)
    const [payment] = await CandidatePayment.query().where('employeeId', paid.employee.id)
    assert.equal(stats.b2c.monthRevenueCents, payment.amountCents)
  })

  test('rend la page design system', async ({ client, assert }) => {
    const superAdmin = await createSuperAdmin()

    const response = await client
      .get('/dashboard/super-admin/design-system')
      .loginAs(superAdmin)
      .withInertia()

    assertPage(assert, response, 'dashboard/admin/DesignSystem')
  })

  test('admin et conseiller sont refusés (403)', async ({ client }) => {
    for (const user of [await createAdmin(), await createAdvisor()]) {
      const response = await client.get('/dashboard/super-admin').loginAs(user).redirects(0)
      response.assertStatus(403)
    }
  })

  test('sans session, redirige vers la connexion', async ({ client }) => {
    const response = await client.get('/dashboard/super-admin').redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/auth/login')
  })
})
