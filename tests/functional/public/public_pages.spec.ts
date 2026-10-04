import { createAdvisor, createCandidate } from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * Pages vitrine (start/routes/public.ts) : toutes derrière `guest()`, sauf les
 * conditions (`LEGAL_PAGES`), lisibles connecté.
 */
const PUBLIC_PAGES: Array<[string, string]> = [
  ['/', 'home'],
  ['/methodologie', 'Methodology'],
  ['/offre', 'Offer'],
  ['/tarifs', 'Pricing'],
  ['/cabinets', 'Cabinets'],
  ['/cabinets/tarifs', 'CabinetPricing'],
  ['/mentions-legales', 'LegalNotice'],
  ['/confidentialite', 'PrivacyPolicy'],
  ['/securite', 'Security'],
  ['/auth/login', 'Login'],
  ['/auth/register', 'Register'],
  ['/inscription', 'RegisterCandidate'],
]

/** `/particuliers` (ancienne URL de l'offre particuliers) : redirection permanente vers l'accueil. */
test.group('Redirection /particuliers (functional)', (group) => {
  group.each.setup(() => truncateDb())

  test('GET /particuliers redirige en 301 vers /', async ({ client }) => {
    const response = await client.get('/particuliers').redirects(0)

    response.assertStatus(301)
    response.assertHeader('location', '/')
  })
})

/** CGU / CGV (#95) : hors `guest()`, un utilisateur connecté doit pouvoir les relire. */
const LEGAL_PAGES: Array<[string, string]> = [
  ['/cgu', 'TermsOfService'],
  ['/cgv', 'TermsOfSale'],
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

test.group('Conditions générales — invité et connecté (functional)', (group) => {
  group.each.setup(() => truncateDb())

  for (const [url, component] of LEGAL_PAGES) {
    test(`GET ${url} rend ${component} à un invité`, async ({ assert, client }) => {
      const response = await client.get(url).withInertia()

      const props = assertPage(assert, response, component, ['errors', 'flash', 'employees'])
      assert.notProperty(props, 'user')
    })

    test(`GET ${url} rend ${component} à un candidat connecté, sans redirection`, async ({
      assert,
      client,
    }) => {
      const { user } = await createCandidate()

      const response = await client.get(url).loginAs(user).withInertia().redirects(0)

      const props = assertPage(assert, response, component, ['user'])
      assert.equal((props.user as { id: number }).id, user.id)
    })

    test(`GET ${url} rend ${component} à un conseiller connecté`, async ({ client }) => {
      const advisor = await createAdvisor()

      const response = await client.get(url).loginAs(advisor).withInertia().redirects(0)

      response.assertStatus(200)
      response.assertInertiaComponent(component)
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
