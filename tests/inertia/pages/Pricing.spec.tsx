import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Pricing from '../../../inertia/pages/Pricing'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../support/inertia_mock')
  return inertiaMock()
})

describe('Pricing page', () => {
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
    expect(screen.getAllByRole('button', { name: /Accès Expert/i }).length).toBeGreaterThan(0)
  })
})
