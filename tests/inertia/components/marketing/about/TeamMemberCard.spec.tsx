import { describe, expect, test } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { TeamMember } from '#shared/constants/team'
import { TeamMemberCard } from '~/components/marketing/about/TeamMemberCard'

const MEMBER: TeamMember = {
  id: 'claire-morel',
  firstName: 'Claire',
  lastName: 'Morel',
  title: 'Psychologue du travail',
  credentials: 'Master de psychologie du travail, titre protégé.',
  bio: 'Claire accompagne des personnes en reconversion.',
  specialties: ['Bilan de compétences', 'Reconversion professionnelle'],
}

describe('TeamMemberCard', () => {
  test('présente le nom en titre, la fonction, le diplôme, la biographie et les spécialités', () => {
    render(<TeamMemberCard member={MEMBER} tint="lavender" />)

    expect(screen.getByRole('heading', { level: 3, name: 'Claire Morel' })).toBeInTheDocument()
    expect(screen.getByText('Psychologue du travail')).toBeInTheDocument()
    expect(screen.getByText(MEMBER.credentials)).toBeInTheDocument()
    expect(screen.getByText(MEMBER.bio)).toBeInTheDocument()

    const specialties = screen.getByRole('list', { name: 'Spécialités de Claire' })
    expect(within(specialties).getAllByRole('listitem')).toHaveLength(2)
    expect(within(specialties).getByText('Bilan de compétences')).toHaveClass('bg-tint-lavender')
  })

  test('le monogramme est décoratif : le nom en texte porte le sens', () => {
    const { container } = render(<TeamMemberCard member={MEMBER} />)

    const monogram = container.querySelector('[aria-hidden="true"]')
    expect(monogram).toHaveTextContent('CM')
    expect(container.querySelector('img')).toBeNull()
  })
})
