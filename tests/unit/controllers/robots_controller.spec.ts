import RobotsController from '#controllers/robots_controller'
import type { HttpContext } from '@adonisjs/core/http'
import config from '@adonisjs/core/services/config'
import { test } from '@japa/runner'

function makeCtx() {
  const headers: Record<string, string> = {}
  const response = {
    header(name: string, value: string) {
      headers[name] = value
    },
  }
  return { ctx: { response } as unknown as HttpContext, headers }
}

test.group('RobotsController.handle', (group) => {
  group.each.setup(() => {
    const previous = config.get<boolean>('seo.indexing')
    return () => config.set('seo.indexing', previous)
  })

  test('Disallow: / par défaut, en text/plain', ({ assert }) => {
    const { ctx, headers } = makeCtx()

    const body = new RobotsController().handle(ctx)

    assert.equal(body, 'User-agent: *\nDisallow: /\n')
    assert.equal(headers['content-type'], 'text/plain; charset=utf-8')
  })

  test('Allow: / quand SEO_INDEXING est activé', ({ assert }) => {
    config.set('seo.indexing', true)
    const { ctx } = makeCtx()

    assert.equal(new RobotsController().handle(ctx), 'User-agent: *\nAllow: /\n')
  })
})
