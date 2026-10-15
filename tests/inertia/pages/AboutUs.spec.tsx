import { describe, test, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { TEAM_MEMBERS, TESTIMONIALS } from '#shared/constants/team'
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
    const heroCard = screen.getByTestId('about-team-card')
    expect(heroCard).toHaveTextContent('Deux psychologues du travail')
    expect(within(heroCard).getByRole('link', { name: 'Découvrir l’équipe' })).toHaveAttribute(
      'href',
      '#equipe'
    )
  })

  test('présente les psychologues de l’équipe et les avis, avec la note de transparence', () => {
    render(<AboutUs />)
    const main = screen.getByRole('main')

    expect(document.getElementById('equipe')).not.toBeNull()
    expect(document.getElementById('avis')).not.toBeNull()
    expect(
      within(main).getByRole('heading', { level: 2, name: /psychologues du travail/i })
    ).toBeInTheDocument()
    for (const member of TEAM_MEMBERS) {
      expect(
        within(main).getByRole('heading', {
          level: 3,
          name: `${member.firstName} ${member.lastName}`,
        })
      ).toBeInTheDocument()
    }
    expect(within(main).getAllByRole('figure')).toHaveLength(TESTIMONIALS.length)
    for (const testimonial of TESTIMONIALS) {
      expect(within(main).getByText(testimonial.author)).toBeInTheDocument()
    }
    expect(within(main).getAllByRole('note')).toHaveLength(2)
    expect(main.querySelector('img')).toBeNull()
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
