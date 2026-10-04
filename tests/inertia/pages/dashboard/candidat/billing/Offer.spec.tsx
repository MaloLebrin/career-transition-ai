import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import OfferPage from '../../../../../../inertia/pages/dashboard/candidat/billing/Offer'

vi.mock('@inertiajs/react', async (importOriginal) => {
  const actual = (await importOriginal()) as object
  return { ...actual, Head: () => null, router: { post: vi.fn() } }
})

vi.mock('../../../../../../inertia/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}))

vi.mock('../../../../../../inertia/components/dashboard/EmailVerificationBanner', () => ({
  EmailVerificationBanner: () => <div data-testid="email-verification-banner" />,
}))

vi.mock('../../../../../../inertia/components/dashboard/b2c/CheckoutConsentForm', () => ({
  CheckoutConsentForm: (props: Record<string, unknown>) => (
    <form data-testid="consent-form" data-props={JSON.stringify(props)} />
  ),
}))

const offer = {
  hasPaidAccess: false,
  emailVerified: true,
  paymentsEnabled: true,
  priceCents: 4900,
  currency: 'eur',
  termsVersion: '2026-10-01',
}

describe('Offer page (#102)', () => {
  test('non payé : bénéfices, prix TTC, formulaire de consentement et version des CGV', () => {
    render(<OfferPage offer={offer} />)

    expect(
      screen.getByRole('heading', { name: 'Débloquez l’ensemble de votre parcours' })
    ).toBeInTheDocument()
    expect(screen.getByText(/49/)).toBeInTheDocument()
    expect(screen.getByText(/Les analyses IA de chaque exercice/)).toBeInTheDocument()
    const form = screen.getByTestId('consent-form')
    expect(JSON.parse(form.getAttribute('data-props') ?? '{}')).toMatchObject({
      paymentsEnabled: true,
      emailVerified: true,
    })
    expect(screen.getByText(/version 2026-10-01/)).toBeInTheDocument()
    expect(screen.getByTestId('email-verification-banner')).toBeInTheDocument()
  })

  test('déjà payé : confirmation et liens, sans formulaire', () => {
    render(<OfferPage offer={{ ...offer, hasPaidAccess: true }} />)

    expect(
      screen.getByRole('heading', { name: 'Vos résultats sont débloqués' })
    ).toBeInTheDocument()
    expect(screen.queryByTestId('consent-form')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Reprendre mon parcours' })).toHaveAttribute(
      'href',
      '/dashboard/candidat'
    )
    expect(screen.getByRole('link', { name: 'Voir ma synthèse' })).toHaveAttribute(
      'href',
      '/dashboard/candidat/synthesis'
    )
  })
})
