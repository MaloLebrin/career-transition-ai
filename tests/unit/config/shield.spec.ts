import shieldConfig from '#config/shield'
import { STRIPE_WEBHOOK_PATH } from '#shared/constants/billing'
import { test } from '@japa/runner'

/** `config/shield.ts` : le webhook Stripe (#104) est la seule route exemptée de CSRF. */
test.group('config/shield', () => {
  test('CSRF : seul le webhook Stripe est exempté, les méthodes mutantes restent protégées', ({
    assert,
  }) => {
    assert.deepEqual(shieldConfig.csrf.exceptRoutes, [STRIPE_WEBHOOK_PATH])
    assert.sameMembers(shieldConfig.csrf.methods ?? [], ['POST', 'PUT', 'PATCH', 'DELETE'])
  })
})
