import SecurityHeadersMiddleware, {
  PERMISSIONS_POLICY,
} from '#middleware/security_headers_middleware'
import type { HttpContext } from '@adonisjs/core/http'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('SecurityHeadersMiddleware', () => {
  test('pose Referrer-Policy strict-origin-when-cross-origin puis continue', async ({ assert }) => {
    const ctx = await testUtils.createHttpContext()
    let called = false

    await new SecurityHeadersMiddleware().handle(ctx, async () => {
      called = true
    })

    assert.isTrue(called)
    assert.equal(ctx.response.getHeader('Referrer-Policy'), 'strict-origin-when-cross-origin')
    assert.equal(ctx.response.getHeader('Permissions-Policy'), PERMISSIONS_POLICY)
  })

  test('X-Robots-Tag noindex sur les espaces privés, pas sur une page marketing', async ({
    assert,
  }) => {
    for (const [url, expected] of [
      ['/auth/login', 'noindex, nofollow'],
      ['/dashboard/candidat', 'noindex, nofollow'],
      ['/tarifs', undefined],
    ] as const) {
      const headers: Record<string, string> = {}
      const ctx = {
        request: { url: () => url },
        response: {
          header: (name: string, value: string) => (headers[name] = value),
          getStatus: () => 200,
        },
      } as unknown as HttpContext

      await new SecurityHeadersMiddleware().handle(ctx, async () => {})

      assert.equal(headers['X-Robots-Tag'], expected, url)
    }
  })

  test('X-Robots-Tag noindex sur une réponse en erreur', async ({ assert }) => {
    const ctx = await testUtils.createHttpContext()

    await new SecurityHeadersMiddleware().handle(ctx, async () => {
      ctx.response.status(404)
    })

    assert.equal(ctx.response.getHeader('X-Robots-Tag'), 'noindex, nofollow')
  })

  test('Permissions-Policy désactive caméra, micro, géolocalisation et paiement', ({ assert }) => {
    for (const feature of ['camera', 'microphone', 'geolocation', 'payment']) {
      assert.include(PERMISSIONS_POLICY, `${feature}=()`)
    }
  })
})
