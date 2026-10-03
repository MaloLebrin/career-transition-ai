import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import IndividualsPage from '../../../../inertia/components/marketing/IndividualsPage'
import { resetInertiaMock, setPageProps } from '../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../support/inertia_mock')
  return inertiaMock()
})

describe('IndividualsPage (#99)', () => {
  beforeEach(() => resetInertiaMock())

  test('inscription ouverte : promesse, exercices offerts, forfait TTC et CTA vers /inscription', () => {
    setPageProps({
      b2cRegistrationEnabled: true,
      billing: { paymentsEnabled: true, resultsPriceCents: 4900, currency: 'eur' },
    })
    render(<IndividualsPage />)

    expect(
      screen.getByRole('heading', { level: 1, name: /Faites le point sur votre carrière/ })
    ).toBeInTheDocument()
    expect(screen.getByText('Analyse Motivations')).toBeInTheDocument()
    expect(screen.getAllByText('Gratuit')).toHaveLength(2)
    expect(screen.getByText('49 €')).toBeInTheDocument()
    expect(screen.getByText('Deux exercices offerts')).toBeInTheDocument()
    expect(screen.getByText('Un expert si vous le souhaitez')).toBeInTheDocument()

    const ctas = screen.getAllByRole('link', { name: 'Commencer gratuitement' })
    expect(ctas.length).toBeGreaterThanOrEqual(2)
    for (const cta of ctas) expect(cta).toHaveAttribute('href', '/inscription')
    expect(screen.getAllByRole('link', { name: 'Voir le tarif' })[0]).toHaveAttribute('href', '/tarifs')
    expect(screen.getByRole('link', { name: 'Découvrir l’offre pour les cabinets' })).toHaveAttribute(
      'href',
      '/offre'
    )
    expect(screen.queryByText(/Être prévenu de l’ouverture/)).not.toBeInTheDocument()
  })

  test('inscription fermée : formulaire de contact et CTA « Être prévenu », prix par défaut', () => {
    setPageProps({ b2cRegistrationEnabled: false })
    render(<IndividualsPage />)

    expect(screen.queryByRole('link', { name: 'Commencer gratuitement' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Être prévenu de l’ouverture' })[0]).toHaveAttribute(
      'href',
      '#contact'
    )
    expect(screen.getByText(/ouvre prochainement/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Envoyer le message' })).toBeInTheDocument()
    expect(screen.getByText('49 €')).toBeInTheDocument()
  })

  test('relie les CGV et la confidentialité, aucun lien vide', () => {
    setPageProps({ b2cRegistrationEnabled: true })
    render(<IndividualsPage />)

    expect(screen.getAllByRole('link', { name: 'Conditions de vente' })[0]).toHaveAttribute(
      'href',
      '/cgv'
    )
    const emptyLinks = screen.getAllByRole('link').filter((link) => link.getAttribute('href') === '#')
    expect(emptyLinks).toHaveLength(0)
  })
})
