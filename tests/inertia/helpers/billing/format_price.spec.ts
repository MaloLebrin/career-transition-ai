import { describe, expect, test } from 'vitest'
import { formatPrice } from '#shared/helpers/billing/format_price'

describe('formatPrice (#101)', () => {
  test('montant rond sans décimales, format français', () => {
    expect(formatPrice(4900)).toBe('49 €')
  })

  test('centimes affichés quand il y en a', () => {
    expect(formatPrice(4990)).toBe('49,90 €')
  })

  test('autre devise', () => {
    expect(formatPrice(1000, 'usd')).toBe('10 $US')
  })
})
