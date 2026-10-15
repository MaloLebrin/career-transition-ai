import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TEAM_MEMBERS } from '#shared/constants/team'
import { TeamTeaser } from '~/components/marketing/individuals/TeamTeaser'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../support/inertia_mock')
  return inertiaMock()
})

describe('TeamTeaser (bloc équipe de l’accueil)', () => {
  test('annonce les psychologues du travail et renvoie vers /qui-sommes-nous', () => {
    render(<TeamTeaser />)

    expect(
      screen.getByRole('heading', { level: 2, name: /psychologues du travail/i })
    ).toBeInTheDocument()
    for (const member of TEAM_MEMBERS) {
      expect(screen.getByText(`${member.firstName} ${member.lastName}`)).toBeInTheDocument()
    }
    expect(screen.getByRole('link', { name: 'Faire connaissance avec l’équipe' })).toHaveAttribute(
      'href',
      '/qui-sommes-nous'
    )
  })

  test('signale que les profils sont des illustrations tant que le drapeau est levé', () => {
    render(<TeamTeaser />)

    expect(screen.getByRole('note')).toHaveTextContent(/illustration/)
  })
})
