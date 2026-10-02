import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'

import TeamAdmin from '../../../../../../inertia/pages/dashboard/admin/team/Index'
import { resetInertiaMock } from '../../../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../../support/inertia_mock')
  return inertiaMock()
})

vi.mock('../../../../../../inertia/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}))

describe('TeamAdmin page (#105)', () => {
  beforeEach(() => resetInertiaMock())

  test('liste les membres avec rôle, candidats suivis et état du compte', () => {
    render(
      <TeamAdmin
        members={[
          {
            id: 7,
            name: 'Nadia Experte',
            email: 'nadia@plateforme.test',
            role: 'advisor',
            onboardingCompleted: true,
            assignedCandidatesCount: 2,
          },
          {
            id: 8,
            name: 'Omar Lecteur',
            email: 'omar@plateforme.test',
            role: 'expert',
            onboardingCompleted: false,
            assignedCandidatesCount: 0,
          },
        ]}
      />
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Équipe interne' })).toBeInTheDocument()
    expect(
      screen.getByRole('form', { name: 'Inviter un membre de l’équipe interne' })
    ).toBeInTheDocument()
    const table = screen.getByRole('table', { name: 'Membres de l’équipe interne' })
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('Nadia Experte')
    expect(rows[0]).toHaveTextContent('Consultant Accompagnateur')
    expect(rows[0]).toHaveTextContent('2')
    expect(rows[0]).toHaveTextContent('Activé')
    expect(rows[1]).toHaveTextContent('Invitation envoyée')
  })

  test('sans membre : état vide, formulaire présent', () => {
    render(<TeamAdmin members={[]} />)

    expect(screen.getByRole('status')).toHaveTextContent('Aucun membre pour le moment.')
    expect(
      screen.getByRole('form', { name: 'Inviter un membre de l’équipe interne' })
    ).toBeInTheDocument()
  })
})
