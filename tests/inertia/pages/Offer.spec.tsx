import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Offer from '../../../inertia/pages/Offer'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../support/inertia_mock')
  return inertiaMock()
})

describe('Offer page', () => {
  test('renders core conversion elements and CTAs', () => {
    render(<Offer />)

    expect(
      screen.getByRole('heading', { level: 1, name: /Un portail expert/i })
    ).toBeInTheDocument()
    expect(screen.getAllByText(/Demander une démo/i).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /Accès Expert/i }).length).toBeGreaterThan(0)
  })
})
