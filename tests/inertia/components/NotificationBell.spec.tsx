import { describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { NotificationBell } from '../../../inertia/components/notifications/NotificationBell'

const { mockRouterPatch } = vi.hoisted(() => ({
  mockRouterPatch: vi.fn(),
}))

vi.mock('@inertiajs/react', () => ({
  usePage: vi.fn(() => ({
    props: {
      user: {
        id: 1,
        role: 'advisor',
        name: 'Advisor',
        email: 'advisor@example.com',
        organizationId: 1,
      },
      notifications: [],
      unreadNotificationsCount: 0,
    },
  })),
  router: {
    patch: mockRouterPatch,
    visit: vi.fn(),
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
          {
            id: 1,
            type: 'exercise_completed',
            status: 'unread',
            title: 'Test notif',
            body: null,
            meta: null,
            readAt: null,
            createdAt: new Date().toISOString(),
          },
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
      { preserveState: true, preserveScroll: true }
    )
  })

  test('affiche la cloche pour un candidat (#70)', async () => {
    const { usePage } = await import('@inertiajs/react')
    vi.mocked(usePage).mockReturnValue({
      props: {
        user: { id: 2, role: 'employee', name: 'Candidate', email: 'c@c.com', organizationId: 1 },
        notifications: [],
        unreadNotificationsCount: 0,
      },
    } as any)

    render(<NotificationBell />)
    expect(screen.getByTitle('Notifications')).toBeInTheDocument()
  })

  test('ouvrir une notification liée la marque lue puis visite la page (#70)', async () => {
    const { usePage, router } = await import('@inertiajs/react')
    mockRouterPatch.mockClear()
    vi.mocked(usePage).mockReturnValue({
      props: {
        user: { id: 2, role: 'employee', name: 'Candidate', email: 'c@c.com', organizationId: 1 },
        notifications: [
          {
            id: 12,
            type: 'synthesis_shared',
            status: 'unread',
            title: 'Votre synthèse est disponible',
            body: null,
            meta: { href: '/dashboard/candidat/synthesis' },
            readAt: null,
            createdAt: new Date().toISOString(),
          },
        ],
        unreadNotificationsCount: 1,
      },
    } as any)

    render(<NotificationBell />)
    fireEvent.click(screen.getByTitle('Notifications'))
    fireEvent.click(screen.getByRole('button', { name: 'Votre synthèse est disponible' }))

    expect(mockRouterPatch).toHaveBeenCalledOnce()
    const [url, , options] = mockRouterPatch.mock.calls[0]
    expect(url).toBe('/dashboard/notifications/12/read')
    options.onFinish()
    expect(router.visit).toHaveBeenCalledWith('/dashboard/candidat/synthesis')
  })

  test('affiche la cloche pour le super admin', async () => {
    const { usePage } = await import('@inertiajs/react')
    vi.mocked(usePage).mockReturnValue({
      props: {
        user: { id: 3, role: 'super_admin', name: 'Root', email: 'r@r.com', organizationId: null },
        notifications: [],
        unreadNotificationsCount: 0,
      },
    } as any)

    render(<NotificationBell />)
    expect(screen.getByTitle('Notifications')).toBeInTheDocument()
  })

  test('ne rend rien pour le rôle expert (routes refusées)', async () => {
    const { usePage } = await import('@inertiajs/react')
    vi.mocked(usePage).mockReturnValue({
      props: {
        user: { id: 4, role: 'expert', name: 'Expert', email: 'e@e.com', organizationId: 1 },
        notifications: [],
        unreadNotificationsCount: 0,
      },
    } as any)

    const { container } = render(<NotificationBell />)
    expect(container.firstChild).toBeNull()
  })
})
