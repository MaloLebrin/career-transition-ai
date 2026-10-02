import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EXERCISE_LIST } from '#shared/constants/exercises'
import LandingPage from '../../../inertia/components/landing/LandingPage'
import { resetInertiaMock } from '../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../support/inertia_mock')
  return inertiaMock()
})

describe('LandingPage', () => {
  beforeEach(() => resetInertiaMock())

  test('renders the hero with its promise and the two actions', () => {
    render(<LandingPage />)

    expect(
      screen.getByRole('heading', { level: 1, name: /Structurez vos bilans de compétences/ })
    ).toBeInTheDocument()
    const demoLinks = screen.getAllByRole('link', { name: 'Demander une démo' })
    expect(demoLinks.map((link) => link.getAttribute('href'))).toContain('#demo')
    expect(screen.getByRole('link', { name: 'Voir la méthodologie' })).toHaveAttribute(
      'href',
      '/methodologie'
    )
    expect(screen.getByRole('img', { name: /Aperçu du tableau de bord/ })).toBeInTheDocument()
    const landscape = screen.getByTestId('hero-landscape')
    expect(landscape).toHaveClass('rounded-2xl', 'overflow-hidden')
    expect(landscape.querySelector('svg[data-variant="hero"]')).toHaveAttribute(
      'aria-hidden',
      'true'
    )
  })

  test('shows the real exercise catalogue, the method and the AI sections', () => {
    render(<LandingPage />)

    for (const exercise of EXERCISE_LIST) {
      expect(screen.getAllByText(exercise.title).length).toBeGreaterThan(0)
    }
    expect(screen.getByText(/Plus qu’un outil/)).toBeInTheDocument()
    expect(screen.getByText(/L’IA comme copilote/)).toBeInTheDocument()
    expect(screen.getByText(/Mistral AI/)).toBeInTheDocument()
    expect(screen.queryByText(/Gemini/)).not.toBeInTheDocument()
  })

  test('ends with the demo form and the call-to-action band', () => {
    render(<LandingPage />)

    expect(screen.getByRole('button', { name: 'Demander une démo' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /Prêt à structurer vos accompagnements/ })
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voir les tarifs' })).toHaveAttribute('href', '/tarifs')
  })
})
