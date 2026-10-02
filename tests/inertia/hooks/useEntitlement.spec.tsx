import { describe, test, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useEntitlement } from '../../../inertia/hooks/use_entitlement'

const mockUsePage = vi.fn()

vi.mock('@inertiajs/react', () => ({
  usePage: (...args: unknown[]) => mockUsePage(...args),
}))

describe('useEntitlement (#94)', () => {
  test('renvoie la prop partagée entitlement du candidat', () => {
    const entitlement = {
      accountType: 'b2c',
      hasPaidAccess: false,
      freeExerciseTypes: ['motivation', 'values'],
      paymentsEnabled: true,
    }
    mockUsePage.mockReturnValue({ props: { entitlement } })

    const { result } = renderHook(() => useEntitlement())

    expect(result.current).toEqual(entitlement)
  })

  test('null hors espace candidat ou quand la prop est absente', () => {
    mockUsePage.mockReturnValue({ props: { entitlement: null } })
    expect(renderHook(() => useEntitlement()).result.current).toBeNull()

    mockUsePage.mockReturnValue({ props: {} })
    expect(renderHook(() => useEntitlement()).result.current).toBeNull()
  })
})
