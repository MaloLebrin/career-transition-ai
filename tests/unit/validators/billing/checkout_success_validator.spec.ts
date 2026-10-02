import { checkoutSuccessValidator } from '#validators/billing/checkout_success_validator'
import { test } from '@japa/runner'

test.group('checkoutSuccessValidator', () => {
  test('accepte un identifiant de session Stripe (espaces retirés)', async ({ assert }) => {
    assert.deepEqual(await checkoutSuccessValidator.validate({ session_id: ' cs_test_a1B2 ' }), {
      session_id: 'cs_test_a1B2',
    })
  })

  test('session_id est optionnel', async ({ assert }) => {
    assert.deepEqual(await checkoutSuccessValidator.validate({}), {})
  })

  test('rejette un format inattendu ou trop long', async ({ assert }) => {
    await assert.rejects(() => checkoutSuccessValidator.validate({ session_id: '../etc' }))
    await assert.rejects(() => checkoutSuccessValidator.validate({ session_id: 'pi_123' }))
    await assert.rejects(() =>
      checkoutSuccessValidator.validate({ session_id: `cs_${'a'.repeat(300)}` })
    )
  })
})
