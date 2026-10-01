import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Methodology from '../../../inertia/pages/Methodology'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../support/inertia_mock')
  return inertiaMock()
})

describe('Methodology page', () => {
  test('renders core marketing sections and CTA', () => {
    render(<Methodology />)

    expect(
      screen.getByRole('heading', { level: 1, name: /Une méthode d'accompagnement/i })
    ).toBeInTheDocument()
    expect(screen.getByText(/Cadre scientifique/i)).toBeInTheDocument()
    expect(screen.getByText(/Pour le conseiller/i)).toBeInTheDocument()
    expect(screen.getByText(/Éthique & limites/i)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Accès Expert/i }).length).toBeGreaterThan(0)
  })
})
