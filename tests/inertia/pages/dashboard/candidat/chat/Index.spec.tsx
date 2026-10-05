import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { makeChatMessage, makeChatSummary } from '../../../../support/factories'
import { resetInertiaMock, routerSpies, setPageProps } from '../../../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../../support/inertia_mock')
  return inertiaMock()
})

vi.mock('../../../../../../inertia/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@adonisjs/transmit-client', () => ({
  Transmit: vi.fn().mockImplementation(() => ({
    close: () => {},
    subscription: () => ({
      create: () => Promise.resolve(),
      delete: () => Promise.resolve(),
      onMessage: () => () => {},
    }),
    on: vi.fn(),
    off: vi.fn(),
  })),
}))

import CandidateChatPage from '../../../../../../inertia/pages/dashboard/candidat/chat/Index'

const conversation = {
  id: 4,
  channel: 'chat/conversations/4',
  expert: null,
  lastMessageAt: null,
  unreadCount: 0,
}

const entitlement = (hasPaidAccess: boolean) => ({
  accountType: 'b2c',
  hasPaidAccess,
  freeExerciseTypes: [],
  paymentsEnabled: false,
})

describe('CandidateChatPage', () => {
  beforeEach(() => resetInertiaMock())

  test('affiche le fil, la file d’attente et le bandeau pour un non payé', () => {
    setPageProps({ entitlement: entitlement(false) })
    render(
      <CandidateChatPage
        conversation={conversation}
        messages={[makeChatMessage({ body: 'Bonjour expert' })]}
        hasMore={false}
      />
    )
    expect(screen.getByRole('heading', { name: 'Discuter avec un expert' })).toBeInTheDocument()
    expect(screen.getByText('Bonjour expert')).toBeInTheDocument()
    expect(screen.getByText(/vous répondra dès que possible/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /découvrez l’accompagnement/ })).toHaveAttribute(
      'href',
      '/dashboard/candidat/accompagnement'
    )
    expect(routerSpies.post).toHaveBeenCalledWith(
      '/dashboard/candidat/chat/read',
      {},
      expect.anything()
    )
  })

  test('pas de bandeau pour un candidat payé, nom de l’expert affiché', () => {
    setPageProps({ entitlement: entitlement(true) })
    render(
      <CandidateChatPage
        conversation={{ ...conversation, expert: { name: 'Julie' } }}
        messages={[]}
        hasMore={false}
      />
    )
    expect(screen.getByText('Votre expert : Julie.')).toBeInTheDocument()
    expect(screen.queryByText(/découvrez l’accompagnement/)).not.toBeInTheDocument()
  })

  test('charge les messages précédents avec le curseur', async () => {
    setPageProps({ entitlement: entitlement(true) })
    render(
      <CandidateChatPage
        conversation={conversation}
        messages={[makeChatMessage({ id: 9 })]}
        hasMore
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /précédents/ }))
    expect(routerSpies.reload).toHaveBeenCalledWith(
      expect.objectContaining({ data: { before: 9 } })
    )
  })
})
