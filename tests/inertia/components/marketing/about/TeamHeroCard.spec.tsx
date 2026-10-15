import { describe, expect, test } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { TEAM_MEMBERS } from '#shared/constants/team'
import { TeamHeroCard } from '~/components/marketing/about/TeamHeroCard'

describe('TeamHeroCard (aside du héros Qui sommes-nous)', () => {
  test('liste les psychologues de l’équipe et renvoie vers la section #equipe', () => {
    render(<TeamHeroCard />)

    const card = screen.getByTestId('about-team-card')
    expect(card).toHaveTextContent('Deux psychologues du travail')
    expect(within(card).getAllByRole('listitem')).toHaveLength(TEAM_MEMBERS.length)
    for (const member of TEAM_MEMBERS) {
      expect(within(card).getByText(`${member.firstName} ${member.lastName}`)).toBeInTheDocument()
    }
    expect(within(card).getByRole('link', { name: 'Découvrir l’équipe' })).toHaveAttribute(
      'href',
      '#equipe'
    )
  })

  test('aucune photo : monogrammes décoratifs seulement, et mention des profils d’illustration', () => {
    const { container } = render(<TeamHeroCard />)

    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThanOrEqual(
      TEAM_MEMBERS.length
    )
    expect(screen.getByText(/Profils d’illustration/)).toBeInTheDocument()
  })
})
