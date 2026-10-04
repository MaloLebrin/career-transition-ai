import { beforeEach, describe, expect, test, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useResultsPriceLabel } from '../../../inertia/hooks/use_results_price_label'
import { resetInertiaMock, setPageProps } from '../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../support/inertia_mock')
  return inertiaMock()
})

describe('useResultsPriceLabel', () => {
  beforeEach(() => resetInertiaMock())

  test('utilise le prix de la prop partagée billing', () => {
    setPageProps({ billing: { paymentsEnabled: true, resultsPriceCents: 5900, currency: 'eur' } })
    const { result } = renderHook(() => useResultsPriceLabel())

    expect(result.current.replace(/\s/g, ' ')).toBe('59 €')
  })

  test('retombe sur le prix par défaut sans prop billing', () => {
    const { result } = renderHook(() => useResultsPriceLabel())

    expect(result.current.replace(/\s/g, ' ')).toBe('49 €')
  })
})
