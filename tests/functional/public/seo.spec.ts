import { createAdvisor } from '#tests/support/actors'
import { truncateDb } from '#tests/utils/db'
import config from '@adonisjs/core/services/config'
import { test } from '@japa/runner'

/**
 * Indexation (issue #25) : `noindex` par défaut pendant la beta, balise
 * google-site-verification seulement avec un vrai jeton, `robots.txt` aligné.
 */
test.group('SEO — balises du layout et robots.txt (functional)', (group) => {
  group.each.setup(() => {
    const indexing = config.get<boolean>('seo.indexing')
    const token = config.get<string | undefined>('seo.googleSiteVerification')
    return () => {
      config.set('seo.indexing', indexing)
      config.set('seo.googleSiteVerification', token)
    }
  })

  test('GET / : noindex, nofollow et pas de google-site-verification par défaut', async ({
    assert,
    client,
  }) => {
    const response = await client.get('/')

    response.assertStatus(200)
    assert.include(response.text(), '<meta name="robots" content="noindex, nofollow" />')
    assert.notInclude(response.text(), 'google-site-verification')
  })

  test('GET / : index, follow et jeton Google quand ils sont configurés', async ({
    assert,
    client,
  }) => {
    config.set('seo.indexing', true)
    config.set('seo.googleSiteVerification', 'jeton-search-console')

    const response = await client.get('/')

    assert.include(response.text(), '<meta name="robots" content="index, follow" />')
    assert.include(
      response.text(),
      '<meta name="google-site-verification" content="jeton-search-console" />'
    )
  })

  test('GET /robots.txt : Disallow par défaut, Allow si indexation', async ({ assert, client }) => {
    const closed = await client.get('/robots.txt')
    closed.assertStatus(200)
    assert.include(closed.header('content-type'), 'text/plain')
    assert.equal(closed.text(), 'User-agent: *\nDisallow: /\n')

    config.set('seo.indexing', true)
    const open = await client.get('/robots.txt')
    assert.equal(open.text(), 'User-agent: *\nAllow: /\n')
  })

  test('GET /robots.txt ne redirige pas un utilisateur connecté', async ({ client }) => {
    await truncateDb()
    const advisor = await createAdvisor()

    const response = await client.get('/robots.txt').loginAs(advisor).redirects(0)

    response.assertStatus(200)
  })
})
