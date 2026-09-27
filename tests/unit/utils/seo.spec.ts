import { ROBOTS_META, robotsMetaContent, robotsTxt } from '#utils/seo'
import { test } from '@japa/runner'

test.group('seo | directives robots', () => {
  test('noindex, nofollow tant que l’indexation est désactivée', ({ assert }) => {
    assert.equal(robotsMetaContent(false), ROBOTS_META.NOINDEX)
    assert.equal(robotsMetaContent(false), 'noindex, nofollow')
    assert.equal(robotsTxt(false), 'User-agent: *\nDisallow: /\n')
  })

  test('index, follow une fois l’indexation activée', ({ assert }) => {
    assert.equal(robotsMetaContent(true), 'index, follow')
    assert.equal(robotsTxt(true), 'User-agent: *\nAllow: /\n')
  })
})
