import SecurityHeadersMiddleware, {
  PERMISSIONS_POLICY,
} from '#middleware/security_headers_middleware'
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

  test('Permissions-Policy désactive caméra, micro, géolocalisation et paiement', ({ assert }) => {
    for (const feature of ['camera', 'microphone', 'geolocation', 'payment']) {
      assert.include(PERMISSIONS_POLICY, `${feature}=()`)
    }
  })
})
