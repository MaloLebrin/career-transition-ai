import SitemapController from '#controllers/sitemap_controller'
import { SITEMAP_PATHS } from '#utils/seo'
import type { HttpContext } from '@adonisjs/core/http'
import { test } from '@japa/runner'

test.group('SitemapController.handle', () => {
  test('XML des pages publiques en URLs absolues', ({ assert }) => {
    const headers: Record<string, string> = {}
    const ctx = {
      response: {
        header(name: string, value: string) {
          headers[name] = value
        },
      },
    } as unknown as HttpContext

    const body = new SitemapController().handle(ctx)

    assert.equal(headers['content-type'], 'application/xml; charset=utf-8')
    assert.equal((body.match(/<loc>/g) ?? []).length, SITEMAP_PATHS.length)
    assert.match(body, /<loc>https?:\/\/[^<]+\/tarifs<\/loc>/)
    assert.notMatch(body, /<loc>[^<]+\/<\/loc>/)
  })
})
