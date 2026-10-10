import { beforeEach, describe, test, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import CabinetPricing from '../../../inertia/pages/CabinetPricing'
import { resetInertiaMock } from '../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../support/inertia_mock')
  return inertiaMock()
})

describe('CabinetPricing page', () => {
  beforeEach(() => resetInertiaMock())

  test('renders three pricing tiers, FAQ and devis CTA', () => {
    render(<CabinetPricing />)

    expect(
      screen.getByRole('heading', { level: 1, name: /Des offres claires/i })
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^Essentiel$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^Professionnel$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^Cabinet\+$/i })).toBeInTheDocument()
    expect(screen.getByText(/Questions fréquentes/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Demander un devis/i).length).toBeGreaterThan(0)
  })

  test('utilise l’en-tête cabinet et renvoie vers le forfait particuliers', () => {
    render(<CabinetPricing />)

    const header = screen.getByRole('banner')
    expect(within(header).getByRole('link', { name: 'Demander une démo' })).toHaveAttribute(
      'href',
      '/cabinets#demo'
    )
    expect(screen.getByRole('link', { name: 'Voir le forfait' })).toHaveAttribute('href', '/tarifs')
  })
})
