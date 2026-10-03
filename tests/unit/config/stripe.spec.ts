import { stripeProductionErrors } from '#config/stripe'
import { test } from '@japa/runner'

/** Garde de démarrage du paiement en production (#102, pattern config/mail). */
function errorsFor(values: Record<string, string | undefined>) {
  return stripeProductionErrors((name) => values[name])
}

const ENABLED_OK = {
  STRIPE_ENABLED: 'true',
  STRIPE_SECRET_KEY: 'sk_live_123',
  STRIPE_WEBHOOK_SECRET: 'whsec_123',
}

test.group('config/stripe — stripeProductionErrors', () => {
  test('aucune exigence tant que STRIPE_ENABLED est faux ou absent', ({ assert }) => {
    assert.deepEqual(errorsFor({}), [])
    assert.deepEqual(errorsFor({ STRIPE_ENABLED: 'false' }), [])
    assert.deepEqual(errorsFor({ STRIPE_ENABLED: '0', STRIPE_SECRET_KEY: 'n’importe quoi' }), [])
  })

  test('activé avec les deux clés : aucune erreur (true ou 1)', ({ assert }) => {
    assert.deepEqual(errorsFor(ENABLED_OK), [])
    assert.deepEqual(errorsFor({ ...ENABLED_OK, STRIPE_ENABLED: '1' }), [])
  })

  test('activé : exige STRIPE_SECRET_KEY et STRIPE_WEBHOOK_SECRET', ({ assert }) => {
    assert.deepEqual(errorsFor({ STRIPE_ENABLED: 'true' }), [
      'STRIPE_SECRET_KEY manquante (STRIPE_ENABLED=true)',
      'STRIPE_WEBHOOK_SECRET manquante (STRIPE_ENABLED=true)',
    ])
    assert.deepEqual(errorsFor({ ...ENABLED_OK, STRIPE_WEBHOOK_SECRET: '  ' }), [
      'STRIPE_WEBHOOK_SECRET manquante (STRIPE_ENABLED=true)',
    ])
  })

  test('refuse des clés mal formées', ({ assert }) => {
    assert.deepEqual(errorsFor({ ...ENABLED_OK, STRIPE_SECRET_KEY: 'pk_live_123' }), [
      'STRIPE_SECRET_KEY invalide (attendu sk_…)',
    ])
    assert.deepEqual(errorsFor({ ...ENABLED_OK, STRIPE_WEBHOOK_SECRET: 'secret' }), [
      'STRIPE_WEBHOOK_SECRET invalide (attendu whsec_…)',
    ])
  })
})
