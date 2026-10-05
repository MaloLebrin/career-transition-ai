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

import ExpertChatShowPage from '../../../../../../inertia/pages/dashboard/conseiller/chat/Show'

describe('ExpertChatShowPage', () => {
  beforeEach(() => resetInertiaMock())

  test('« Prendre » apparaît dans la file et appelle la route de prise en charge', async () => {
    render(
      <ExpertChatShowPage
        conversation={makeChatSummary({ id: 12, assignment: 'queue' })}
        messages={[makeChatMessage({ body: 'Besoin d’aide' })]}
        hasMore={false}
      />
    )
    expect(screen.getByText('Besoin d’aide')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Prendre' }))
    expect(routerSpies.post).toHaveBeenCalledWith(
      '/dashboard/conseiller/chat/12/claim',
      {},
      { preserveScroll: true }
    )
    expect(routerSpies.post).toHaveBeenCalledWith(
      '/dashboard/conseiller/chat/12/read',
      {},
      expect.anything()
    )
  })

  test('pas de bouton « Prendre » sur ma conversation', () => {
    render(
      <ExpertChatShowPage
        conversation={makeChatSummary({ assignment: 'me' })}
        messages={[]}
        hasMore={false}
      />
    )
    expect(screen.queryByRole('button', { name: 'Prendre' })).not.toBeInTheDocument()
  })

  test('signale une conversation prise par un autre expert', () => {
    render(
      <ExpertChatShowPage
        conversation={makeChatSummary({ assignment: 'other' })}
        messages={[]}
        hasMore={false}
      />
    )
    expect(screen.getByText(/prise par un autre expert/)).toBeInTheDocument()
  })
})
