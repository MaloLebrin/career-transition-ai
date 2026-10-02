import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import ExpertSupportPage from '../../../../../../inertia/pages/dashboard/candidat/expert/Index'
import type { ExpertSupportView } from '#shared/types/expert_request/views'
import { resetInertiaMock, setPageProps } from '../../../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../../support/inertia_mock')
  return inertiaMock()
})

vi.mock('../../../../../../inertia/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}))

const eligible: ExpertSupportView = {
  eligible: true,
  lockedReason: null,
  request: null,
  expert: null,
}
const pending = {
  id: 1,
  status: 'pending' as const,
  message: 'Je veux construire mon plan.',
  availability: null,
  createdAt: '2026-10-02T10:00:00.000Z',
  handledAt: null,
  declineReason: null,
}

describe('Expert support page (#103)', () => {
  beforeEach(() => {
    resetInertiaMock()
    setPageProps({ billing: { paymentsEnabled: false, resultsPriceCents: 4900, currency: 'eur' } })
  })

  test('éligible sans demande : le formulaire', () => {
    render(<ExpertSupportPage support={eligible} />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Être accompagné par un expert' })
    ).toBeInTheDocument()
    expect(screen.getByRole('form', { name: 'Demande d’accompagnement' })).toBeInTheDocument()
  })

  test('demande en attente : statut, pas de formulaire', () => {
    render(<ExpertSupportPage support={{ ...eligible, request: pending }} />)

    expect(
      screen.getByRole('status', { name: 'Votre demande d’accompagnement' })
    ).toBeInTheDocument()
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
  })

  test('refusée : statut et nouveau formulaire', () => {
    render(
      <ExpertSupportPage
        support={{
          ...eligible,
          request: { ...pending, status: 'declined', declineReason: 'Plus tard' },
        }}
      />
    )

    expect(screen.getByText('Refusée')).toBeInTheDocument()
    expect(screen.getByRole('form', { name: 'Demande d’accompagnement' })).toBeInTheDocument()
  })

  test('expert assigné : carte expert, ni statut ni formulaire', () => {
    render(
      <ExpertSupportPage
        support={{
          ...eligible,
          request: { ...pending, status: 'accepted' },
          expert: { name: 'Nadia Experte' },
        }}
      />
    )

    expect(screen.getByText('Votre expert : Nadia Experte')).toBeInTheDocument()
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('status', { name: 'Votre demande d’accompagnement' })
    ).not.toBeInTheDocument()
  })

  test('non payé : carte « réservé au forfait » ; B2B : message conseiller', () => {
    render(
      <ExpertSupportPage support={{ ...eligible, eligible: false, lockedReason: 'payment' }} />
    )
    expect(
      screen.getByRole('region', { name: 'L’accompagnement par un expert est réservé au forfait' })
    ).toBeInTheDocument()
    expect(screen.queryByRole('form')).not.toBeInTheDocument()

    render(<ExpertSupportPage support={{ ...eligible, eligible: false, lockedReason: 'b2b' }} />)
    expect(screen.getByText(/assuré par votre conseiller/)).toBeInTheDocument()
  })
})
