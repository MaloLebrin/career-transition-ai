import { describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { NotificationBell } from '../../../inertia/components/notifications/NotificationBell'

const { mockRouterPatch } = vi.hoisted(() => ({
  mockRouterPatch: vi.fn(),
}))

vi.mock('@inertiajs/react', () => ({
  usePage: vi.fn(() => ({
    props: {
      user: { id: 1, role: 'advisor', name: 'Advisor', email: 'advisor@example.com', organizationId: 1 },
      notifications: [],
      unreadNotificationsCount: 0,
    },
  })),
  router: {
    patch: mockRouterPatch,
  },
}))

vi.mock('@adonisjs/transmit-client', () => ({
  Transmit: vi.fn().mockImplementation(() => ({
    subscription: vi.fn().mockReturnValue({
      create: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      onMessage: vi.fn().mockReturnValue(() => {}),
    }),
  })),
}))

describe('NotificationBell', () => {
  test('affiche la cloche pour un rôle advisor', () => {
    render(<NotificationBell />)
    expect(screen.getByTitle('Notifications')).toBeInTheDocument()
  })

  test("n'affiche pas de badge quand aucune notification non lue", () => {
    render(<NotificationBell />)
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument()
  })

  test('affiche le badge avec le compteur de non-lues', async () => {
    const { usePage } = await import('@inertiajs/react')
    vi.mocked(usePage).mockReturnValue({
      props: {
        user: { id: 1, role: 'advisor', name: 'Advisor', email: 'a@a.com', organizationId: 1 },
        notifications: [],
        unreadNotificationsCount: 3,
      },
    } as any)

    render(<NotificationBell />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  test('ouvre le dropdown en cliquant sur la cloche', async () => {
    const { usePage } = await import('@inertiajs/react')
    vi.mocked(usePage).mockReturnValue({
      props: {
        user: { id: 1, role: 'advisor', name: 'Advisor', email: 'a@a.com', organizationId: 1 },
        notifications: [],
        unreadNotificationsCount: 0,
      },
    } as any)

    render(<NotificationBell />)
    fireEvent.click(screen.getByTitle('Notifications'))
    expect(screen.getByText('Aucune notification')).toBeInTheDocument()
  })

  test('affiche "Tout marquer comme lu" quand il y a des non-lues et appelle router.patch', async () => {
    const { usePage } = await import('@inertiajs/react')
    vi.mocked(usePage).mockReturnValue({
      props: {
        user: { id: 1, role: 'advisor', name: 'Advisor', email: 'a@a.com', organizationId: 1 },
        notifications: [
          { id: 1, type: 'exercise_completed', status: 'unread', title: 'Test notif', body: null, meta: null, readAt: null, createdAt: new Date().toISOString() },
        ],
        unreadNotificationsCount: 1,
      },
    } as any)

    render(<NotificationBell />)
    fireEvent.click(screen.getByTitle('Notifications'))
    const markAllBtn = screen.getByText('Tout marquer comme lu')
    fireEvent.click(markAllBtn)
    expect(mockRouterPatch).toHaveBeenCalledWith(
      '/dashboard/notifications/read-all',
      {},
      { preserveState: true }
    )
  })

  test("ne rend rien pour le rôle employee", async () => {
    const { usePage } = await import('@inertiajs/react')
    vi.mocked(usePage).mockReturnValue({
      props: {
        user: { id: 2, role: 'employee', name: 'Candidate', email: 'c@c.com', organizationId: 1 },
        notifications: [],
        unreadNotificationsCount: 0,
      },
    } as any)

    const { container } = render(<NotificationBell />)
    expect(container.firstChild).toBeNull()
  })
})
