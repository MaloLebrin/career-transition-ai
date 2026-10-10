import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import IndividualsPage from '../../../../inertia/components/marketing/IndividualsPage'
import { resetInertiaMock, setPageProps } from '../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../support/inertia_mock')
  return inertiaMock()
})

describe('IndividualsPage (accueil particuliers)', () => {
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
    expect(screen.getByTestId('hero-backdrop')).toBeInTheDocument()
    expect(
      screen.getByText(/Analyse Motivations et Recherche de Valeurs offerts, sans carte bancaire/)
    ).toBeInTheDocument()
    const facts = screen.getByRole('region', { name: 'Chiffres clés' })
    expect(facts).toHaveTextContent('8exercices issus des sciences comportementales')
    expect(facts).toHaveTextContent('2exercices offerts, sans carte bancaire')
    expect(facts).toHaveTextContent('49 €le forfait, payé une seule fois')
    expect(screen.getByRole('group', { name: 'Forfait particuliers' })).toHaveTextContent('49 €')

    const ctas = screen.getAllByRole('link', { name: 'Commencer gratuitement' })
    expect(ctas.length).toBeGreaterThanOrEqual(2)
    for (const cta of ctas) expect(cta).toHaveAttribute('href', '/inscription')
    expect(screen.getAllByRole('link', { name: 'Voir le tarif' })[0]).toHaveAttribute(
      'href',
      '/tarifs'
    )
    for (const link of screen.getAllByRole('link', { name: 'Se connecter' })) {
      expect(link).toHaveAttribute('href', '/auth/login')
    }
    expect(screen.queryByText(/Être prévenu de l’ouverture/)).not.toBeInTheDocument()
  })

  test('présente le catalogue des exercices ancré sur #parcours', () => {
    render(<IndividualsPage />)

    expect(document.getElementById('parcours')).not.toBeNull()
    expect(screen.getByRole('heading', { name: /exercices pour y voir clair/ })).toBeInTheDocument()
  })

  test('présente les fonctionnalités en onglets, au clavier', async () => {
    const user = userEvent.setup()
    render(<IndividualsPage />)

    const tabs = screen.getAllByRole('tab')
    expect(tabs.map((tab) => tab.textContent)).toEqual(
      expect.arrayContaining([expect.stringContaining('Les exercices')])
    )
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Sauvegarde automatique')

    await user.click(tabs[1])
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{ArrowDown}')
    expect(tabs[2]).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Export PDF')
  })

  test('explique les étapes et le parcours des données', () => {
    render(<IndividualsPage />)

    expect(
      screen.getByRole('heading', { name: 'Créez votre compte en deux minutes' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('list', { name: 'Parcours de vos données avant l’analyse' })
    ).toHaveTextContent('Pseudonymisation')
  })

  test('renvoie vers l’espace cabinet', () => {
    render(<IndividualsPage />)

    expect(screen.getByRole('link', { name: 'Découvrir l’espace cabinet' })).toHaveAttribute(
      'href',
      '/cabinets'
    )
  })

  test('inscription fermée : formulaire de contact et CTA « Être prévenu », prix par défaut', () => {
    setPageProps({ b2cRegistrationEnabled: false })
    render(<IndividualsPage />)

    expect(screen.queryByRole('link', { name: 'Commencer gratuitement' })).not.toBeInTheDocument()
    const waitlist = screen.getAllByRole('link', { name: 'Être prévenu de l’ouverture' })
    expect(waitlist.map((link) => link.getAttribute('href'))).toContain('#contact')
    expect(screen.getByText(/ouvre prochainement/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Envoyer le message' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Forfait particuliers' })).toHaveTextContent('49 €')
  })

  test('relie les CGV et la confidentialité, aucun lien vide', () => {
    setPageProps({ b2cRegistrationEnabled: true })
    render(<IndividualsPage />)

    expect(screen.getAllByRole('link', { name: 'Conditions de vente' })[0]).toHaveAttribute(
      'href',
      '/cgv'
    )
    const emptyLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href') === '#')
    expect(emptyLinks).toHaveLength(0)
  })
})
