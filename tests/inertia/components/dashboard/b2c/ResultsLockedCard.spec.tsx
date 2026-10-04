import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { RESULTS_BENEFITS, ResultsLockedCard } from '~/components/dashboard/b2c/ResultsLockedCard'

const { billingState } = vi.hoisted(() => ({
  billingState: {
    value: { paymentsEnabled: true, resultsPriceCents: 4900, currency: 'eur' } as Record<
      string,
      unknown
    > | null,
  },
}))

vi.mock('../../../../../inertia/hooks/use_billing', () => ({
  useBilling: () => billingState.value,
}))

vi.mock('@inertiajs/react', () => ({
  Head: () => null,
  router: { visit: vi.fn() },
  Link: ({ href, className, children, ...rest }: any) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}))

describe('ResultsLockedCard (#101)', () => {
  test('bénéfices, prix TTC et CTA vers l’offre quand le paiement est activé', () => {
    billingState.value = { paymentsEnabled: true, resultsPriceCents: 4990, currency: 'eur' }
    render(<ResultsLockedCard />)

    expect(
      screen.getByRole('region', { name: 'Vos résultats sont réservés au forfait' })
    ).toBeInTheDocument()
    for (const benefit of RESULTS_BENEFITS) {
      expect(screen.getByText(benefit)).toBeInTheDocument()
    }
    expect(screen.getByText(/49,90/)).toBeInTheDocument()
    expect(screen.getByText(/TTC, paiement unique/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Débloquer mes résultats' })).toHaveAttribute(
      'href',
      '/dashboard/candidat/offre'
    )
  })

  test('paiement désactivé : « Paiement bientôt disponible », sans lien', () => {
    billingState.value = { paymentsEnabled: false, resultsPriceCents: 4900, currency: 'eur' }
    render(<ResultsLockedCard title="Votre synthèse est réservée au forfait" />)

    expect(
      screen.getByRole('region', { name: 'Votre synthèse est réservée au forfait' })
    ).toBeInTheDocument()
    expect(screen.getByText('Paiement bientôt disponible')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  test('variante compacte : sans la liste des bénéfices ; sans prop billing, pas de prix', () => {
    billingState.value = null
    render(<ResultsLockedCard compact description="Courte description." />)

    expect(screen.getByText('Courte description.')).toBeInTheDocument()
    expect(screen.queryByText(RESULTS_BENEFITS[0])).not.toBeInTheDocument()
    expect(screen.queryByText(/TTC/)).not.toBeInTheDocument()
    expect(screen.getByText('Paiement bientôt disponible')).toBeInTheDocument()
  })
})
