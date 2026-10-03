import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'

import { ExpertRequestStatus } from '~/components/dashboard/b2c/ExpertRequestStatus'
import type { ExpertRequestView } from '#shared/types/expert_request/views'

const base: ExpertRequestView = {
  id: 1,
  status: 'pending',
  message: 'Je veux construire mon plan.',
  availability: 'Mardi soir',
  createdAt: '2026-10-02T10:00:00.000Z',
  handledAt: null,
  declineReason: null,
}

describe('ExpertRequestStatus (#103)', () => {
  test('en attente : statut, message, disponibilités et explication', () => {
    render(<ExpertRequestStatus request={base} expert={null} />)

    const card = screen.getByRole('status', { name: 'Votre demande d’accompagnement' })
    expect(card).toHaveTextContent('En attente')
    expect(card).toHaveTextContent('Je veux construire mon plan.')
    expect(card).toHaveTextContent('Disponibilités : Mardi soir')
    expect(card).toHaveTextContent(/vous contactera prochainement/)
  })

  test('acceptée : nom de l’expert assigné', () => {
    render(
      <ExpertRequestStatus
        request={{ ...base, status: 'accepted', handledAt: '2026-10-03T10:00:00.000Z' }}
        expert={{ name: 'Nadia Experte' }}
      />
    )

    expect(screen.getByText('Acceptée')).toBeInTheDocument()
    expect(screen.getByText('Votre expert : Nadia Experte')).toBeInTheDocument()
  })

  test('refusée : motif quand il existe', () => {
    render(
      <ExpertRequestStatus
        request={{ ...base, status: 'declined', declineReason: 'Aucun expert disponible' }}
        expert={null}
      />
    )

    expect(screen.getByText('Refusée')).toBeInTheDocument()
    expect(screen.getByText(/Demande refusée : Aucun expert disponible/)).toBeInTheDocument()
  })
})
