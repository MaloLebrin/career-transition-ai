import SecurityHeadersMiddleware from '#middleware/security_headers_middleware'
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
  })
})
