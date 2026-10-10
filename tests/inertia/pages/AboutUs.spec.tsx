import { describe, test, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import AboutUs from '../../../inertia/pages/AboutUs'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../support/inertia_mock')
  return inertiaMock()
})

describe('AboutUs page', () => {
  test('affiche la mission et les sections principales', () => {
    render(<AboutUs />)

    expect(
      screen.getByRole('heading', { level: 1, name: /faire le point sur sa carrière/i })
    ).toBeInTheDocument()
    expect(screen.getByText('Notre approche')).toBeInTheDocument()
    expect(screen.getByText('Nos engagements')).toBeInTheDocument()
    expect(screen.getByText('Une IA copilote')).toBeInTheDocument()
    expect(
      screen.getByTestId('about-landscape').querySelector('svg[data-variant="hero"]')
    ).not.toBeNull()
  })

  test('renvoie vers la sécurité, la confidentialité et l’espace cabinet', () => {
    render(<AboutUs />)
    const main = screen.getByRole('main')

    expect(within(main).getByRole('link', { name: 'sécurité' })).toHaveAttribute(
      'href',
      '/securite'
    )
    expect(
      within(main).getByRole('link', { name: /politique de confidentialité/i })
    ).toHaveAttribute('href', '/confidentialite')
    expect(within(main).getByRole('link', { name: 'Espace cabinet' })).toHaveAttribute(
      'href',
      '/cabinets'
    )
  })
})
