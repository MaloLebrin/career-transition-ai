import { beforeEach, describe, expect, test, vi } from 'vitest'
import { screen } from '@testing-library/react'

import ExpertRequestsAdmin from '../../../../../../inertia/pages/dashboard/admin/expert_requests/Index'
import type { AdminExpertRequestRow } from '#shared/types/expert_request/admin'
import { renderWithUser } from '../../../../support/render'
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

const base: AdminExpertRequestRow = {
  id: 1,
  status: 'pending',
  message: 'Message A',
  availability: null,
  createdAt: '2026-10-02T10:00:00.000Z',
  handledAt: null,
  declineReason: null,
  candidate: { id: 1, name: 'Alice', email: 'alice@example.test', hasPaidAccess: true },
  assignedExpert: null,
  handledBy: null,
}

describe('ExpertRequestsAdmin page (#105)', () => {
  beforeEach(() => resetInertiaMock())

  test('compte les demandes en attente et filtre par statut', async () => {
    const { user } = renderWithUser(
      <ExpertRequestsAdmin
        requests={[
          base,
          {
            ...base,
            id: 2,
            status: 'declined',
            declineReason: 'Non.',
            candidate: { ...base.candidate, id: 2, name: 'Bruno' },
          },
        ]}
        experts={[]}
      />
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Demandes d’accompagnement' })
    ).toBeInTheDocument()
    expect(screen.getByText(/1 en attente · 2 au total/)).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Filtrer par statut' }),
      'declined'
    )
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByRole('listitem', { name: 'Demande de Bruno' })).toBeInTheDocument()

    await user.selectOptions(screen.getByRole('combobox', { name: 'Filtrer par statut' }), 'closed')
    expect(screen.getByRole('status')).toHaveTextContent('Aucune demande pour ce filtre.')
  })

  test('sans demande : état vide', () => {
    renderWithUser(<ExpertRequestsAdmin requests={[]} experts={[]} />)

    expect(screen.getByText(/0 en attente · 0 au total/)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Aucune demande pour ce filtre.')
  })
})
