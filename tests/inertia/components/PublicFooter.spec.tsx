import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PRIVACY_CONTACT_EMAIL } from '#shared/constants/legal'
import PublicFooter from '../../../inertia/components/layout/PublicFooter'
import { resetInertiaMock } from '../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../support/inertia_mock')
  return inertiaMock()
})

describe('PublicFooter', () => {
  beforeEach(() => resetInertiaMock())

  test('links to the product and legal pages, without buttons', () => {
    render(<PublicFooter />)

    expect(screen.getByRole('link', { name: 'Le parcours' })).toHaveAttribute('href', '/#parcours')
    expect(screen.getByRole('link', { name: 'Tarif' })).toHaveAttribute('href', '/tarifs')
    expect(screen.getByRole('link', { name: 'Espace cabinet' })).toHaveAttribute(
      'href',
      '/cabinets'
    )
    expect(screen.getByRole('link', { name: 'Offre' })).toHaveAttribute('href', '/offre')
    expect(screen.getByRole('link', { name: 'Tarifs' })).toHaveAttribute('href', '/cabinets/tarifs')
    expect(screen.getByRole('link', { name: 'Méthodologie' })).toHaveAttribute(
      'href',
      '/methodologie'
    )
    expect(screen.getByRole('link', { name: 'Demander une démo' })).toHaveAttribute(
      'href',
      '/cabinets#demo'
    )
    expect(screen.getByRole('link', { name: 'Qui sommes-nous' })).toHaveAttribute(
      'href',
      '/qui-sommes-nous'
    )
    expect(screen.getByRole('link', { name: 'Sécurité' })).toHaveAttribute('href', '/securite')
    expect(screen.getByRole('link', { name: 'Mentions légales' })).toHaveAttribute(
      'href',
      '/mentions-legales'
    )
    expect(screen.getByRole('link', { name: 'Politique de confidentialité' })).toHaveAttribute(
      'href',
      '/confidentialite'
    )
    // CGU / CGV (#95), lisibles connecté comme invité.
    expect(screen.getByRole('link', { name: 'Conditions d’utilisation' })).toHaveAttribute(
      'href',
      '/cgu'
    )
    expect(screen.getByRole('link', { name: 'Conditions de vente' })).toHaveAttribute(
      'href',
      '/cgv'
    )
    expect(screen.getByRole('link', { name: 'Se connecter' })).toHaveAttribute(
      'href',
      '/auth/login'
    )
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  test('gives the contact e-mail and the copyright on a dark surface', () => {
    render(<PublicFooter />)

    expect(screen.getByRole('link', { name: PRIVACY_CONTACT_EMAIL })).toHaveAttribute(
      'href',
      `mailto:${PRIVACY_CONTACT_EMAIL}`
    )
    const footer = screen.getByRole('contentinfo')
    expect(footer).toHaveClass('bg-ink')
    expect(footer).toHaveTextContent('© 2026 Transition Carrière')
  })
})
