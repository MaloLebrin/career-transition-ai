import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import CheckoutSuccessPage from '../../../../../../inertia/pages/dashboard/candidat/billing/Success'

vi.mock('@inertiajs/react', async (importOriginal) => {
  const actual = (await importOriginal()) as object
  return { ...actual, Head: () => null }
})

vi.mock('../../../../../../inertia/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>,
}))

describe('Checkout success page (#102)', () => {
  test('paiement confirmé : remerciement et liens vers le parcours et la synthèse', () => {
    render(<CheckoutSuccessPage paid />)

    expect(screen.getByRole('status')).toHaveTextContent('Merci, vos résultats sont débloqués')
    expect(screen.getByRole('link', { name: 'Reprendre mon parcours' })).toHaveAttribute(
      'href',
      '/dashboard/candidat'
    )
    expect(screen.getByRole('link', { name: 'Voir ma synthèse' })).toBeInTheDocument()
  })

  test('paiement en cours : explication et retour à l’offre', () => {
    render(<CheckoutSuccessPage paid={false} />)

    expect(screen.getByRole('status')).toHaveTextContent(/en cours de confirmation/)
    expect(screen.getByRole('link', { name: 'Revoir l’offre' })).toHaveAttribute(
      'href',
      '/dashboard/candidat/offre'
    )
  })
})
