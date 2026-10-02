import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Individuals from '../../../inertia/pages/Individuals'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../support/inertia_mock')
  return inertiaMock()
})

describe('Individuals page (#99)', () => {
  test('rend la page particuliers dans la coquille publique', () => {
    render(<Individuals />)

    expect(
      screen.getByRole('heading', { level: 1, name: /Faites le point sur votre carrière/ })
    ).toBeInTheDocument()
    // En-tête, menu mobile et pied de page pointent tous vers la page.
    const navLinks = screen.getAllByRole('link', { name: 'Particuliers' })
    expect(navLinks.length).toBeGreaterThan(1)
    for (const link of navLinks) expect(link).toHaveAttribute('href', '/particuliers')
    expect(screen.getAllByRole('link', { name: 'Se connecter' }).length).toBeGreaterThan(0)
  })
})
