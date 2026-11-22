import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import IndividualsPage from '../../../../inertia/components/marketing/IndividualsPage'
import { resetInertiaMock, setPageProps } from '../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../support/inertia_mock')
  return inertiaMock()
})

describe('IndividualsPage (accueil jumpUjob, planche 47)', () => {
  beforeEach(() => resetInertiaMock())

  test('héros : accroche, phrase, deux boutons, mention des exercices offerts', () => {
    setPageProps({ b2cRegistrationEnabled: true })
    const { container } = render(<IndividualsPage />)

    const backdrop = screen.getByTestId('hero-backdrop')
    expect(backdrop).toHaveAttribute('data-scene', 'landscape')
    expect(backdrop.querySelector('svg[data-variant="hero"]')).not.toBeNull()
    const companion = container.querySelector('svg[data-pose="wave"]')
    expect(companion).not.toBeNull()
    expect(companion?.querySelector('.companion-float')).not.toBeNull()

    expect(
      screen.getByRole('heading', { level: 1, name: /Le saut, oui\.\s*Le vide, non\./ })
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('main')).getByText(
        /Faites le point sur votre carrière à votre rythme/
      )
    ).toBeInTheDocument()
    expect(screen.getAllByText('Deux exercices offerts, sans carte bancaire.')).toHaveLength(1)
    expect(screen.getAllByRole('link', { name: 'Voir le tarif' })[0]).toHaveAttribute(
      'href',
      '/tarifs'
    )
  })

  test('six blocs dans l’ordre du brief, un seul prix et un seul mockup', () => {
    setPageProps({
      b2cRegistrationEnabled: true,
      billing: { paymentsEnabled: true, resultsPriceCents: 4900, currency: 'eur' },
    })
    render(<IndividualsPage />)

    const headings = within(screen.getByRole('main'))
      .getAllByRole('heading', { level: 2 })
      .map((h) => h.textContent)
    expect(headings).toEqual([
      'Trois étapes, aucune pression.',
      'Huit exercices pour y voir clair.',
      'Paiement unique, sans abonnement.',
      'Sautez. On tient la rampe.',
    ])
    expect(screen.getByRole('region', { name: 'Confiance' })).toBeInTheDocument()
    expect(screen.getAllByText('49 €')).toHaveLength(1)
    expect(screen.getByRole('group', { name: 'Forfait particuliers' })).toHaveTextContent(
      'TTC · payé une seule fois'
    )
    expect(screen.getAllByTestId('journey-progress')).toHaveLength(1)
  })

  test('n’affiche plus les blocs retirés par le brief', () => {
    render(<IndividualsPage />)

    expect(screen.queryByRole('region', { name: 'Chiffres clés' })).not.toBeInTheDocument()
    expect(screen.queryByText('Ce que vous obtenez')).not.toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.queryByText('Vous accompagnez des candidats ?')).not.toBeInTheDocument()
  })

  test('le parcours : pastilles sans description, ancre #parcours, lien vers /parcours', () => {
    render(<IndividualsPage />)

    expect(document.getElementById('parcours')).not.toBeNull()
    const pills = screen.getByRole('list', { name: 'Les exercices du parcours' })
    expect(within(pills).getAllByRole('listitem')).toHaveLength(8)
    expect(within(pills).getByText('Analyse Motivations')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voir le détail des exercices' })).toHaveAttribute(
      'href',
      '/parcours'
    )
  })

  test('inscription ouverte : chaque CTA mène à /inscription, rien vers la liste d’attente', () => {
    setPageProps({ b2cRegistrationEnabled: true })
    render(<IndividualsPage />)

    const ctas = screen.getAllByRole('link', { name: 'Commencer gratuitement' })
    expect(ctas.length).toBeGreaterThanOrEqual(3)
    for (const cta of ctas) expect(cta).toHaveAttribute('href', '/inscription')
    expect(screen.queryByText(/Être prévenu de l’ouverture/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Envoyer le message' })).not.toBeInTheDocument()
  })

  test('inscription fermée : formulaire de contact et CTA « Être prévenu » vers #contact', () => {
    setPageProps({ b2cRegistrationEnabled: false })
    render(<IndividualsPage />)

    expect(screen.queryByRole('link', { name: 'Commencer gratuitement' })).not.toBeInTheDocument()
    const waitlist = within(screen.getByRole('main')).getAllByRole('link', {
      name: 'Être prévenu de l’ouverture',
    })
    for (const link of waitlist) expect(link).toHaveAttribute('href', '#contact')
    expect(screen.getByText(/ouvre prochainement/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Envoyer le message' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Forfait particuliers' })).toHaveTextContent('49 €')
  })

  test('confiance condensée avec le lien vers la page sécurité', () => {
    render(<IndividualsPage />)

    const trust = screen.getByRole('region', { name: 'Confiance' })
    expect(within(trust).getByText('Pseudonymisé avant l’IA')).toBeInTheDocument()
    expect(within(trust).getByRole('link', { name: 'Lire la page sécurité' })).toHaveAttribute(
      'href',
      '/securite'
    )
  })

  test('l’espace cabinet reste accessible par le pied de page, aucun lien vide', () => {
    setPageProps({ b2cRegistrationEnabled: true })
    render(<IndividualsPage />)

    const footer = screen.getByRole('contentinfo')
    expect(within(footer).getByRole('link', { name: 'Espace cabinet' })).toHaveAttribute(
      'href',
      '/cabinets'
    )
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
