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
    subscription: () => ({
      create: () => Promise.resolve(),
      delete: () => Promise.resolve(),
      onMessage: () => () => {},
    }),
    on: vi.fn(),
    off: vi.fn(),
  })),
}))

import ExpertChatIndexPage from '../../../../../../inertia/pages/dashboard/conseiller/chat/Index'

describe('ExpertChatIndexPage', () => {
  beforeEach(() => resetInertiaMock())

  test('liste les conversations avec les non-lus', () => {
    render(
      <ExpertChatIndexPage
        conversations={[
          makeChatSummary({ unreadCount: 2 }),
          makeChatSummary({ id: 2, candidateLabel: 'Candidat #9', assignment: 'me' }),
        ]}
      />
    )
    expect(screen.getByRole('heading', { name: 'Messages des candidats' })).toBeInTheDocument()
    expect(screen.getByText('Candidat #7')).toBeInTheDocument()
    expect(screen.getByLabelText('2 non lus')).toBeInTheDocument()
    expect(screen.getByText('Mes conversations')).toBeInTheDocument()
  })
})
