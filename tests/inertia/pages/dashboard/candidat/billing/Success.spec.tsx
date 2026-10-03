import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'

import CheckoutSuccessPage from '../../../../../../inertia/pages/dashboard/candidat/billing/Success'
import { routerSpies, resetInertiaMock } from '../../../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../../support/inertia_mock')
  return { ...inertiaMock(), Head: () => null }
})

vi.mock('../../../../../../inertia/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}))

describe('Checkout success page (#102)', () => {
  beforeEach(() => {
    resetInertiaMock()
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  test('paiement confirmé : remerciement, liens, aucun rechargement', () => {
    render(<CheckoutSuccessPage paid />)

    expect(screen.getByRole('status')).toHaveTextContent('Merci, vos résultats sont débloqués')
    expect(screen.getByRole('link', { name: 'Reprendre mon parcours' })).toHaveAttribute(
      'href',
      '/dashboard/candidat'
    )
    expect(screen.getByRole('link', { name: 'Voir ma synthèse' })).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(60_000))
    expect(routerSpies.reload).not.toHaveBeenCalled()
  })

  test('paiement en cours : explication et retour à l’offre', () => {
    render(<CheckoutSuccessPage paid={false} />)

    expect(screen.getByRole('status')).toHaveTextContent(/en cours de confirmation/)
    expect(screen.getByRole('link', { name: 'Revoir l’offre' })).toHaveAttribute(
      'href',
      '/dashboard/candidat/offre'
    )
  })

  test('paiement en cours : recharge la prop paid, puis s’arrête après 5 essais', () => {
    render(<CheckoutSuccessPage paid={false} />)

    act(() => vi.advanceTimersByTime(3000))
    expect(routerSpies.reload).toHaveBeenCalledWith({ only: ['paid'] })
    act(() => vi.advanceTimersByTime(60_000))
    expect(routerSpies.reload).toHaveBeenCalledTimes(5)
  })
})
