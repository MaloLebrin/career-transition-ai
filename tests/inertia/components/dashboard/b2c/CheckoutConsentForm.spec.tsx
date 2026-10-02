import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { CheckoutConsentForm } from '~/components/dashboard/b2c/CheckoutConsentForm'
import { renderWithUser } from '../../../support/render'
import { formSubmissions, resetInertiaMock, setInertiaOutcome } from '../../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../support/inertia_mock')
  return inertiaMock()
})

describe('CheckoutConsentForm (#102)', () => {
  beforeEach(() => resetInertiaMock())

  test('deux consentements, CGV en lien, bouton « Payer » actif quand tout est possible', () => {
    render(<CheckoutConsentForm paymentsEnabled emailVerified priceLabel="49 €" />)

    expect(screen.getByRole('checkbox', { name: /conditions générales de vente/ })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: /droit de rétractation/ })).not.toBeChecked()
    expect(screen.getByRole('link', { name: 'conditions générales de vente' })).toHaveAttribute(
      'href',
      '/cgv'
    )
    expect(screen.getByRole('button', { name: /Payer 49 €/ })).toBeEnabled()
    expect(screen.getByText(/Paiement sécurisé par Stripe/)).toBeInTheDocument()
  })

  test('soumet les deux cases cochées sur la route de checkout', async () => {
    setInertiaOutcome('pending')
    const { user } = renderWithUser(
      <CheckoutConsentForm paymentsEnabled emailVerified priceLabel="49 €" />
    )

    await user.click(screen.getByRole('checkbox', { name: /conditions générales de vente/ }))
    await user.click(screen.getByRole('checkbox', { name: /droit de rétractation/ }))
    await user.click(screen.getByRole('button', { name: /Payer 49 €/ }))

    expect(formSubmissions).toHaveLength(1)
    expect(formSubmissions[0]).toMatchObject({
      method: 'post',
      url: '/dashboard/candidat/offre/checkout',
      data: { acceptTerms: true, waiveWithdrawal: true },
    })
    expect(screen.getByRole('button', { name: /Payer 49 €/ })).toHaveAttribute('aria-busy', 'true')
  })

  test('paiement désactivé : bouton « Bientôt disponible » inactif', () => {
    render(<CheckoutConsentForm paymentsEnabled={false} emailVerified priceLabel="49 €" />)

    expect(screen.getByRole('button', { name: /Bientôt disponible/ })).toBeDisabled()
  })

  test('e-mail non vérifié : bouton inactif et rappel', () => {
    render(<CheckoutConsentForm paymentsEnabled emailVerified={false} priceLabel="49 €" />)

    expect(screen.getByRole('button', { name: /Payer 49 €/ })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(/Confirmez d’abord votre adresse e-mail/)
  })
})
