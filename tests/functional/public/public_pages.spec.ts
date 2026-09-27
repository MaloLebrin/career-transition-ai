import { createAdvisor, createCandidate } from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * Pages vitrine (start/routes/public.ts) : toutes derrière `guest()`.
 */
const PUBLIC_PAGES: Array<[string, string]> = [
  ['/', 'home'],
  ['/methodologie', 'Methodology'],
  ['/offre', 'Offer'],
  ['/tarifs', 'Pricing'],
  ['/mentions-legales', 'LegalNotice'],
  ['/confidentialite', 'PrivacyPolicy'],
  ['/securite', 'Security'],
  ['/auth/login', 'Login'],
  ['/auth/register', 'Register'],
]

test.group('Pages publiques — invité (functional)', (group) => {
  group.each.setup(() => truncateDb())

  for (const [url, component] of PUBLIC_PAGES) {
    test(`GET ${url} rend ${component}`, async ({ assert, client }) => {
      const response = await client.get(url).withInertia()

      const props = assertPage(assert, response, component, ['errors', 'flash', 'employees'])
      assert.notProperty(props, 'user')
      assert.deepEqual(props.employees, [])
    })
  }
})

test.group('Pages publiques — utilisateur connecté (functional)', (group) => {
  group.each.setup(() => truncateDb())

  for (const [url] of PUBLIC_PAGES) {
    test(`GET ${url} redirige un conseiller connecté vers /dashboard`, async ({ client }) => {
      const advisor = await createAdvisor()

      const response = await client.get(url).loginAs(advisor).redirects(0)

      response.assertStatus(302)
      response.assertHeader('location', '/dashboard')
    })
  }

  test('la redirection guest conserve la query string', async ({ client }) => {
    const { user } = await createCandidate()

    const response = await client
      .get('/tarifs')
      .qs({ ref: 'newsletter' })
      .loginAs(user)
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/dashboard?ref=newsletter')
  })
})
