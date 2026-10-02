import { beforeEach, describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Pricing from '../../../inertia/pages/Pricing'
import { resetInertiaMock, setPageProps } from '../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../support/inertia_mock')
  return inertiaMock()
})

describe('Pricing page', () => {
  beforeEach(() => resetInertiaMock())

  test('renders three pricing tiers, FAQ and devis CTA', () => {
    render(<Pricing />)

    expect(
      screen.getByRole('heading', { level: 1, name: /Des offres claires/i })
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^Essentiel$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^Professionnel$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^Cabinet\+$/i })).toBeInTheDocument()
    expect(screen.getByText(/Questions fréquentes/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Demander un devis/i).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Se connecter' }).length).toBeGreaterThan(0)
  })

  test('bloc « Particuliers » (#99) : prix TTC de la prop billing, lien vers la page, CTA si inscription ouverte', () => {
    setPageProps({
      b2cRegistrationEnabled: true,
      billing: { paymentsEnabled: false, resultsPriceCents: 5900, currency: 'eur' },
    })
    render(<Pricing />)

    const card = screen.getByRole('group', { name: 'Forfait particuliers' })
    expect(card).toHaveTextContent('59 €')
    expect(card).toHaveTextContent('TTC, une seule fois')
    expect(screen.getByRole('link', { name: 'Découvrir le parcours particuliers' })).toHaveAttribute(
      'href',
      '/particuliers'
    )
    expect(screen.getByRole('link', { name: 'Commencer gratuitement' })).toHaveAttribute(
      'href',
      '/inscription'
    )
  })

  test('inscription fermée : pas de CTA d’inscription, prix par défaut', () => {
    setPageProps({ b2cRegistrationEnabled: false })
    render(<Pricing />)

    expect(screen.queryByRole('link', { name: 'Commencer gratuitement' })).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Forfait particuliers' })).toHaveTextContent('49 €')
  })
})
