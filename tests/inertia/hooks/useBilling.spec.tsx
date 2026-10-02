import { describe, test, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useBilling } from '../../../inertia/hooks/use_billing'

const mockUsePage = vi.fn()

vi.mock('@inertiajs/react', () => ({
  usePage: (...args: unknown[]) => mockUsePage(...args),
}))

describe('useBilling (#101)', () => {
  test('renvoie la prop partagée billing', () => {
    const billing = { paymentsEnabled: false, resultsPriceCents: 4900, currency: 'eur' }
    mockUsePage.mockReturnValue({ props: { billing } })

    expect(renderHook(() => useBilling()).result.current).toEqual(billing)
  })

  test('null quand la prop est absente', () => {
    mockUsePage.mockReturnValue({ props: {} })
    expect(renderHook(() => useBilling()).result.current).toBeNull()
  })
})
