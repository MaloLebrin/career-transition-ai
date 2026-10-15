import { describe, expect, test } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { TEAM_MEMBERS } from '#shared/constants/team'
import { TeamHeroCard } from '~/components/marketing/about/TeamHeroCard'

describe('TeamHeroCard (aside du héros Qui sommes-nous)', () => {
  test('présente chaque psychologue sur une tuile teintée et renvoie vers la section #equipe', () => {
    render(<TeamHeroCard />)

    const card = screen.getByTestId('about-team-card')
    expect(card).toHaveTextContent('Deux psychologues du travail')
    const tiles = within(card).getAllByRole('listitem')
    expect(tiles).toHaveLength(TEAM_MEMBERS.length)
    tiles.forEach((tile, index) => {
      const member = TEAM_MEMBERS[index]
      expect(tile).toHaveTextContent(`${member.firstName} ${member.lastName}`)
      expect(tile).toHaveTextContent(member.title)
      expect(tile).toHaveTextContent(member.specialties[0])
      expect(tile.className).toMatch(/bg-tint-/)
    })
    expect(within(card).getByRole('link', { name: 'Découvrir l’équipe' })).toHaveAttribute(
      'href',
      '#equipe'
    )
  })

  test('aucune photo : monogrammes décoratifs, mention des profils d’illustration', () => {
    const { container } = render(<TeamHeroCard />)

    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThanOrEqual(
      TEAM_MEMBERS.length
    )
    expect(screen.getByText(/Profils d’illustration/)).toBeInTheDocument()
  })
})
