import { describe, expect, test } from 'vitest'
import { checkoutDiscountCents, isCheckoutSettled } from '#shared/helpers/billing/checkout_session'

describe('isCheckoutSettled (#139)', () => {
  test('paid et no_payment_required (code promo à 100 %) sont réglés', () => {
    expect(isCheckoutSettled('paid')).toBe(true)
    expect(isCheckoutSettled('no_payment_required')).toBe(true)
  })

  test('unpaid, inconnu ou absent ne le sont pas', () => {
    expect(isCheckoutSettled('unpaid')).toBe(false)
    expect(isCheckoutSettled('complete')).toBe(false)
    expect(isCheckoutSettled(null)).toBe(false)
    expect(isCheckoutSettled(undefined)).toBe(false)
  })
})

describe('checkoutDiscountCents (#139)', () => {
  test('amount_discount transmis par Stripe fait foi', () => {
    expect(
      checkoutDiscountCents({ amountDiscount: 980, amountSubtotal: 4900, amountTotal: 3920 })
    ).toBe(980)
    expect(
      checkoutDiscountCents({ amountDiscount: 0, amountSubtotal: 4900, amountTotal: 4900 })
    ).toBe(0)
  })

  test('à défaut, écart entre sous-total et total, jamais négatif', () => {
    expect(checkoutDiscountCents({ amountSubtotal: 4900, amountTotal: 3920 })).toBe(980)
    expect(checkoutDiscountCents({ amountSubtotal: 4900, amountTotal: 0 })).toBe(4900)
    expect(checkoutDiscountCents({ amountSubtotal: 4900, amountTotal: 5000 })).toBe(0)
    expect(checkoutDiscountCents({ amountDiscount: -5 })).toBe(0)
  })

  test('sans montants : 0', () => {
    expect(checkoutDiscountCents({})).toBe(0)
    expect(checkoutDiscountCents({ amountTotal: 4900 })).toBe(0)
    expect(checkoutDiscountCents({ amountSubtotal: null, amountTotal: null })).toBe(0)
  })
})
