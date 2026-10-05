import {
  NOINDEX_PATH_PREFIXES,
  ROBOTS_META,
  SITEMAP_PATHS,
  canonicalUrl,
  isNoindexPath,
  robotsMetaContent,
  robotsTxt,
  sitemapXml,
  trailingSlashTarget,
} from '#utils/seo'
import { test } from '@japa/runner'

test.group('seo | directives robots', () => {
  test('noindex, nofollow tant que l’indexation est désactivée', ({ assert }) => {
    assert.equal(robotsMetaContent(false), ROBOTS_META.NOINDEX)
    assert.equal(robotsMetaContent(false), 'noindex, nofollow')
    assert.equal(robotsTxt(false, 'https://exemple.fr/sitemap.xml'), 'User-agent: *\nDisallow: /\n')
  })

  test('index, follow une fois l’indexation activée', ({ assert }) => {
    assert.equal(robotsMetaContent(true), 'index, follow')
    assert.equal(
      robotsTxt(true),
      'User-agent: *\nAllow: /\nDisallow: /auth\nDisallow: /dashboard\nDisallow: /onboarding\nDisallow: /inscription\n'
    )
  })

  test('robots.txt ouvert exclut les espaces privés et annonce le sitemap', ({ assert }) => {
    const body = robotsTxt(true, 'https://exemple.fr/sitemap.xml')

    for (const prefix of NOINDEX_PATH_PREFIXES) assert.include(body, `Disallow: ${prefix}\n`)
    assert.include(body, '\nSitemap: https://exemple.fr/sitemap.xml\n')
  })
})

test.group('seo | sitemap, canonical, noindex', () => {
  test('sitemapXml liste les URLs et échappe les caractères XML', ({ assert }) => {
    const xml = sitemapXml(['https://exemple.fr', 'https://exemple.fr/a?b=1&c=2'])

    assert.include(xml, '<loc>https://exemple.fr</loc>')
    assert.include(xml, '<loc>https://exemple.fr/a?b=1&amp;c=2</loc>')
    assert.include(xml, 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')
  })

  test('les pages du sitemap ne sont jamais des espaces noindex', ({ assert }) => {
    for (const path of SITEMAP_PATHS) assert.isFalse(isNoindexPath(path), path)
  })

  test('isNoindexPath compare des segments entiers', ({ assert }) => {
    assert.isTrue(isNoindexPath('/auth/login'))
    assert.isTrue(isNoindexPath('/dashboard'))
    assert.isTrue(isNoindexPath('/onboarding/abc'))
    assert.isTrue(isNoindexPath('/inscription'))
    assert.isFalse(isNoindexPath('/authentique'))
    assert.isFalse(isNoindexPath('/tarifs'))
  })

  test('canonicalUrl retire slash final et query string', ({ assert }) => {
    assert.equal(canonicalUrl('https://exemple.fr/', '/'), 'https://exemple.fr')
    assert.equal(canonicalUrl('https://exemple.fr', '/tarifs/'), 'https://exemple.fr/tarifs')
    assert.equal(canonicalUrl('https://exemple.fr', '/tarifs?utm=x'), 'https://exemple.fr/tarifs')
  })

  test('trailingSlashTarget ne vise que les chemins avec slash final', ({ assert }) => {
    assert.isNull(trailingSlashTarget('/'))
    assert.isNull(trailingSlashTarget('/tarifs'))
    assert.equal(trailingSlashTarget('/tarifs/'), '/tarifs')
    assert.equal(trailingSlashTarget('/tarifs//?a=1'), '/tarifs?a=1')
  })
})
