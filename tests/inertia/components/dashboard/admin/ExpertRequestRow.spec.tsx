import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'

import { ExpertRequestRow } from '~/components/dashboard/admin/ExpertRequestRow'
import type { AdminExpertRequestRow, PlatformTeamMember } from '#shared/types/expert_request/admin'
import { renderWithUser } from '../../../support/render'
import { formSubmissions, resetInertiaMock } from '../../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../support/inertia_mock')
  return inertiaMock()
})

const experts: PlatformTeamMember[] = [
  {
    id: 7,
    name: 'Nadia Experte',
    email: 'nadia@plateforme.test',
    role: 'advisor',
    onboardingCompleted: true,
    assignedCandidatesCount: 0,
  },
]

const pending: AdminExpertRequestRow = {
  id: 3,
  status: 'pending',
  message: 'Je veux construire mon plan.',
  availability: 'Mardi soir',
  createdAt: '2026-10-02T10:00:00.000Z',
  handledAt: null,
  declineReason: null,
  candidate: { id: 21, name: 'Camille Durand', email: 'camille@example.test', hasPaidAccess: true },
  assignedExpert: null,
  handledBy: null,
}

function renderRow(request: AdminExpertRequestRow) {
  return renderWithUser(
    <ul>
      <ExpertRequestRow request={request} experts={experts} />
    </ul>
  )
}

describe('ExpertRequestRow (#105)', () => {
  beforeEach(() => resetInertiaMock())

  test('en attente : contexte du candidat, assignation et refus possibles', () => {
    renderRow(pending)

    const row = screen.getByRole('listitem', { name: 'Demande de Camille Durand' })
    expect(within(row).getByText('camille@example.test', { exact: false })).toBeInTheDocument()
    expect(within(row).getByText('Forfait réglé')).toBeInTheDocument()
    expect(within(row).getByText('En attente')).toBeInTheDocument()
    expect(within(row).getByText('Disponibilités : Mardi soir')).toBeInTheDocument()
    expect(within(row).getByRole('form', { name: 'Assigner un expert' })).toBeInTheDocument()
    expect(within(row).getByRole('button', { name: 'Refuser la demande' })).toBeInTheDocument()
  })

  test('refus : saisie du motif puis envoi sur la route de refus', async () => {
    const { user } = renderRow(pending)

    await user.click(screen.getByRole('button', { name: 'Refuser la demande' }))
    expect(screen.queryByRole('form', { name: 'Assigner un expert' })).not.toBeInTheDocument()
    await user.type(
      screen.getByRole('textbox', { name: /Motif du refus/ }),
      'Aucun expert disponible.'
    )
    await user.click(screen.getByRole('button', { name: 'Confirmer le refus' }))

    expect(formSubmissions[0]).toMatchObject({
      method: 'post',
      url: '/dashboard/super-admin/expert-requests/3/decline',
      data: { reason: 'Aucun expert disponible.' },
    })
  })

  test('acceptée : expert, traitant et date ; plus d’action', () => {
    renderRow({
      ...pending,
      status: 'accepted',
      handledAt: '2026-10-03T09:00:00.000Z',
      assignedExpert: { id: 7, name: 'Nadia Experte' },
      handledBy: { id: 1, name: 'Super Admin' },
    })

    expect(screen.getByText('Acceptée')).toBeInTheDocument()
    expect(screen.getByText(/Expert assigné :/)).toHaveTextContent('Nadia Experte')
    expect(screen.getByText(/par Super Admin/)).toBeInTheDocument()
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Refuser la demande' })).not.toBeInTheDocument()
  })

  test('refusée : motif et forfait non réglé signalés', () => {
    renderRow({
      ...pending,
      status: 'declined',
      declineReason: 'Plus tard.',
      candidate: { ...pending.candidate, hasPaidAccess: false },
    })

    expect(screen.getByText('Refusée')).toBeInTheDocument()
    expect(screen.getByText(/Plus tard\./)).toBeInTheDocument()
    expect(screen.getByText('Forfait non réglé')).toBeInTheDocument()
  })
})
