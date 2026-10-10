import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EXERCISE_LIST } from '#shared/constants/exercises'
import CabinetLandingPage from '../../../inertia/components/landing/CabinetLandingPage'
import { resetInertiaMock } from '../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../support/inertia_mock')
  return inertiaMock()
})

describe('CabinetLandingPage', () => {
  beforeEach(() => resetInertiaMock())

  test('renders the hero with its promise and the two actions', () => {
    render(<CabinetLandingPage />)

    expect(
      screen.getByRole('heading', { level: 1, name: /Structurez vos bilans de compétences/ })
    ).toBeInTheDocument()
    const demoLinks = screen.getAllByRole('link', { name: 'Demander une démo' })
    expect(demoLinks.map((link) => link.getAttribute('href'))).toContain('/cabinets#demo')
    expect(screen.getByRole('link', { name: 'Voir la méthodologie' })).toHaveAttribute(
      'href',
      '/methodologie'
    )
    expect(screen.getByTestId('hero-backdrop')).toBeInTheDocument()
    expect(screen.getAllByRole('figure')[0]).toHaveTextContent('Tableau de bord conseiller')
  })

  test('states verifiable key facts and the advisor features in tabs', async () => {
    const user = userEvent.setup()
    render(<CabinetLandingPage />)

    const facts = screen.getByRole('region', { name: 'Chiffres clés' })
    expect(facts).toHaveTextContent('8exercices prêts à l’emploi')
    expect(facts).toHaveTextContent('0nom ou e-mail de candidat transmis à l’IA')

    await user.click(screen.getByRole('tab', { name: /Synthèse assistée/ }))
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Le conseiller valide')
  })

  test('shows the real exercise catalogue, the method and the AI sections', () => {
    render(<CabinetLandingPage />)

    for (const exercise of EXERCISE_LIST) {
      expect(screen.getAllByText(exercise.title).length).toBeGreaterThan(0)
    }
    expect(screen.getByText(/Plus qu’un outil/)).toBeInTheDocument()
    expect(screen.getByText(/L’IA comme copilote/)).toBeInTheDocument()
    expect(screen.getByText(/Mistral AI/)).toBeInTheDocument()
    expect(screen.queryByText(/Gemini/)).not.toBeInTheDocument()
  })

  test('ends with the demo form and the call-to-action band', () => {
    render(<CabinetLandingPage />)

    expect(screen.getByRole('button', { name: 'Demander une démo' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /Prêt à structurer vos accompagnements/ })
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voir les tarifs' })).toHaveAttribute(
      'href',
      '/cabinets/tarifs'
    )
  })
})
