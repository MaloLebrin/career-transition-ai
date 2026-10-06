import { PromotionCodesService } from '#services/billing/promotion_codes_service'
import { setErrorReporter, type ErrorContext } from '#services/error_tracking_service'
import { FakeStripeGateway } from '#tests/support/fake_stripe'
import { test } from '@japa/runner'

test.group('PromotionCodesService.labelFor (#139)', () => {
  test('relit le libellé du code chez Stripe', async ({ assert }) => {
    const stripe = new FakeStripeGateway()
    stripe.promotionCodes.set('promo_test_1', 'BIENVENUE20')

    const label = await new PromotionCodesService(stripe).labelFor('promo_test_1')

    assert.equal(label, 'BIENVENUE20')
    assert.deepEqual(stripe.retrievedPromotionCodes, ['promo_test_1'])
  })

  test('sans id : null, aucun appel', async ({ assert }) => {
    const stripe = new FakeStripeGateway()
    const service = new PromotionCodesService(stripe)

    assert.isNull(await service.labelFor(null))
    assert.isNull(await service.labelFor(undefined))
    assert.isNull(await service.labelFor(''))
    assert.lengthOf(stripe.retrievedPromotionCodes, 0)
  })

  test('code inconnu chez Stripe : null, sans erreur signalée', async ({ assert }) => {
    const stripe = new FakeStripeGateway()
    const reported: ErrorContext[] = []
    const previous = setErrorReporter({ capture: (_error, context) => reported.push(context) })

    try {
      assert.isNull(await new PromotionCodesService(stripe).labelFor('promo_unknown'))
    } finally {
      setErrorReporter(previous)
    }
    assert.lengthOf(reported, 0)
  })

  test('panne Stripe : null et erreur signalée une fois (id seulement), jamais levée', async ({
    assert,
  }) => {
    const stripe = new FakeStripeGateway()
    stripe.promotionCodes.set('promo_test_2', 'OFFERT100')
    stripe.failNextPromotionCodeRetrieve = true
    const reported: ErrorContext[] = []
    const previous = setErrorReporter({ capture: (_error, context) => reported.push(context) })

    try {
      assert.isNull(await new PromotionCodesService(stripe).labelFor('promo_test_2'))
    } finally {
      setErrorReporter(previous)
    }
    assert.lengthOf(reported, 1)
    assert.equal(reported[0].tags?.step, 'promotion_code_label')
    assert.deepEqual(reported[0].extra, { promotionCodeId: 'promo_test_2' })
    assert.notInclude(JSON.stringify(reported), 'OFFERT100')
  })
})
