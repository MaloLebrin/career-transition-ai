import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import OfferPage from '../../../../inertia/components/marketing/OfferPage'
import { resetInertiaMock } from '../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../support/inertia_mock')
  return inertiaMock()
})

describe('OfferPage', () => {
  beforeEach(() => resetInertiaMock())

  test('affiche le titre principal et les actions de conversion', () => {
    render(<OfferPage />)

    expect(
      screen.getByRole('heading', { level: 1, name: /Un portail expert/i })
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voir la méthodologie' })).toHaveAttribute(
      'href',
      '/methodologie'
    )
    expect(screen.getAllByRole('link', { name: /Demander une démo/ }).length).toBeGreaterThan(0)
  })

  test('relie les pages légales et les tarifs sans lien vide', () => {
    render(<OfferPage />)

    // Présent dans la carte « copilote » et dans le footer.
    const privacyLinks = screen.getAllByRole('link', { name: 'Politique de confidentialité' })
    expect(privacyLinks.length).toBeGreaterThan(1)
    for (const link of privacyLinks) expect(link).toHaveAttribute('href', '/confidentialite')
    expect(screen.getByRole('link', { name: 'Voir les tarifs' })).toHaveAttribute('href', '/tarifs')
    const emptyLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href') === '#')
    expect(emptyLinks).toHaveLength(0)
  })
})
