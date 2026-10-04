import TrailingSlashMiddleware from '#middleware/trailing_slash_middleware'
import type { HttpContext } from '@adonisjs/core/http'
import { test } from '@japa/runner'

function makeCtx(method: string, url: string) {
  const redirects: Array<{ status: number; target: string }> = []
  const ctx = {
    request: { method: () => method, url: () => url },
    response: {
      redirect: () => ({
        status: (status: number) => ({
          toPath: (target: string) => redirects.push({ status, target }),
        }),
      }),
    },
  } as unknown as HttpContext
  return { ctx, redirects }
}

test.group('TrailingSlashMiddleware', () => {
  test('GET /tarifs/ → 301 /tarifs en gardant la query string', async ({ assert }) => {
    const { ctx, redirects } = makeCtx('GET', '/tarifs/?a=1')
    let called = false

    await new TrailingSlashMiddleware().handle(ctx, async () => {
      called = true
    })

    assert.isFalse(called)
    assert.deepEqual(redirects, [{ status: 301, target: '/tarifs?a=1' }])
  })

  test('laisse passer une URL canonique, la racine et les écritures', async ({ assert }) => {
    for (const [method, url] of [
      ['GET', '/tarifs'],
      ['GET', '/'],
      ['POST', '/contact-requests/'],
    ]) {
      const { ctx, redirects } = makeCtx(method, url)
      let called = false

      await new TrailingSlashMiddleware().handle(ctx, async () => {
        called = true
      })

      assert.isTrue(called, `${method} ${url}`)
      assert.deepEqual(redirects, [])
    }
  })
})
