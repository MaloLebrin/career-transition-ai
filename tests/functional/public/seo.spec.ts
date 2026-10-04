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

  test('GET / : canonical et og:url absolus, une seule description', async ({ assert, client }) => {
    const response = await client.get('/')
    const text = response.text()

    assert.match(text, /<link rel="canonical" href="https?:\/\/[^"]+" \/>/)
    assert.match(text, /<meta property="og:url" content="https?:\/\/[^"]+" \/>/)
    assert.equal((text.match(/name="description"/g) ?? []).length, 1)
  })

  test('GET /tarifs?utm=x : canonical sans query string', async ({ assert, client }) => {
    const response = await client.get('/tarifs?utm=x')
    const text = response.text()

    assert.match(text, /<link rel="canonical" href="https?:\/\/[^"?]+\/tarifs" \/>/)
  })

  test('GET /tarifs/ : 301 vers /tarifs', async ({ client }) => {
    const response = await client.get('/tarifs/').redirects(0)

    response.assertStatus(301)
    response.assertHeader('location', '/tarifs')
  })

  test('X-Robots-Tag noindex sur /auth/login, absent sur /tarifs', async ({ assert, client }) => {
    const login = await client.get('/auth/login')
    const pricing = await client.get('/tarifs')

    assert.equal(login.header('x-robots-tag'), 'noindex, nofollow')
    assert.isUndefined(pricing.header('x-robots-tag'))
  })

  test('GET /sitemap.xml : pages publiques en XML, sans espaces privés', async ({
    assert,
    client,
  }) => {
    const response = await client.get('/sitemap.xml').redirects(0)

    response.assertStatus(200)
    assert.include(response.header('content-type'), 'application/xml')
    assert.include(response.text(), '/cabinets/tarifs</loc>')
    assert.notInclude(response.text(), '/auth')
    assert.notInclude(response.text(), '/dashboard')
  })

  test('GET /robots.txt : Disallow par défaut, Allow si indexation', async ({ assert, client }) => {
    const closed = await client.get('/robots.txt')
    closed.assertStatus(200)
    assert.include(closed.header('content-type'), 'text/plain')
    assert.equal(closed.text(), 'User-agent: *\nDisallow: /\n')

    config.set('seo.indexing', true)
    const open = await client.get('/robots.txt')
    assert.include(open.text(), 'User-agent: *\nAllow: /\n')
    assert.include(open.text(), 'Disallow: /dashboard\n')
    assert.include(open.text(), '/sitemap.xml\n')
  })

  test('GET /robots.txt ne redirige pas un utilisateur connecté', async ({ client }) => {
    await truncateDb()
    const advisor = await createAdvisor()

    const response = await client.get('/robots.txt').loginAs(advisor).redirects(0)

    response.assertStatus(200)
  })
})
