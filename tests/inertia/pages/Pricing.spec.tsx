import { beforeEach, describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Pricing from '../../../inertia/pages/Pricing'
import { resetInertiaMock, setPageProps } from '../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../support/inertia_mock')
  return inertiaMock()
})

describe('Pricing page (forfait particuliers)', () => {
  beforeEach(() => resetInertiaMock())

  test('forfait TTC de la prop billing, FAQ, CTA d’inscription si ouverte', () => {
    setPageProps({
      b2cRegistrationEnabled: true,
      billing: { paymentsEnabled: false, resultsPriceCents: 5900, currency: 'eur' },
    })
    render(<Pricing />)

    expect(
      screen.getByRole('heading', { level: 1, name: /Un forfait unique, réglé une fois/ })
    ).toBeInTheDocument()
    const card = screen.getByRole('group', { name: 'Forfait particuliers' })
    expect(card).toHaveTextContent('59 €')
    expect(card).toHaveTextContent('TTC')
    expect(screen.getByText('Questions fréquentes')).toBeInTheDocument()
    for (const cta of screen.getAllByRole('link', { name: 'Commencer gratuitement' })) {
      expect(cta).toHaveAttribute('href', '/inscription')
    }
  })

  test('renvoie vers la grille tarifaire des cabinets', () => {
    render(<Pricing />)

    expect(screen.getByRole('link', { name: 'Voir les tarifs cabinets' })).toHaveAttribute(
      'href',
      '/cabinets/tarifs'
    )
  })

  test('inscription fermée : liste d’attente, prix par défaut', () => {
    setPageProps({ b2cRegistrationEnabled: false })
    render(<Pricing />)

    expect(screen.queryByRole('link', { name: 'Commencer gratuitement' })).not.toBeInTheDocument()
    const waitlist = screen.getAllByRole('link', { name: 'Être prévenu de l’ouverture' })
    expect(waitlist.map((link) => link.getAttribute('href'))).toContain('#contact')
    expect(screen.getByRole('group', { name: 'Forfait particuliers' })).toHaveTextContent('49 €')
  })
})
