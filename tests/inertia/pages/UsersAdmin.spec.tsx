import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import UsersAdmin from '../../../inertia/pages/dashboard/admin/users/Index'

vi.mock('../../../inertia/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Super Admin', role: 'super_admin' as const },
  }),
}))

vi.mock('../../../inertia/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const { postMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
}))

vi.mock('@inertiajs/react', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    Head: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    router: {
      ...actual.router,
      post: postMock,
    },
  }
})

describe('UsersAdmin page', () => {
  beforeEach(() => {
    postMock.mockClear()
  })

  test('renders users table for super admin', () => {
    const users = [
      {
        id: 1,
        name: 'Alice',
        email: 'alice@example.com',
        role: 'advisor' as const,
        organization: { id: 10, name: 'Cabinet Alpha' },
        createdAt: '2025-01-01T00:00:00.000Z',
      },
    ]

    render(<UsersAdmin users={users} />)

    expect(screen.getByText(/Utilisateurs de la plateforme/i)).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    expect(screen.getByText('Cabinet Alpha')).toBeInTheDocument()
  })

  test('opens confirmation modal then posts role change on confirm', () => {
    const users = [
      {
        id: 2,
        name: 'Bob',
        email: 'bob@example.com',
        role: 'employee' as const,
        organization: { id: 11, name: 'Cabinet Beta' },
        createdAt: '2025-02-01T00:00:00.000Z',
      },
    ]

    render(<UsersAdmin users={users} />)

    const select = screen.getByDisplayValue('Tous les rôles')
    fireEvent.change(select, { target: { value: 'employee' } })

    expect(screen.getByText('Bob')).toBeInTheDocument()

    const row = screen.getByText('Bob').closest('tr') as HTMLElement
    fireEvent.click(within(row).getByRole('button', { name: /Admin orga/i }))

    const dialog = screen.getByRole('dialog', { name: /Modifier le rôle/i })
    expect(dialog).toBeInTheDocument()
    expect(
      within(dialog).getByText(/Vous allez passer Bob du rôle « Employé » au rôle « Admin orga »/)
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Confirmer le changement/i }))

    expect(postMock).toHaveBeenCalledWith(
      '/dashboard/super-admin/users/2/role',
      { role: 'admin' },
      expect.objectContaining({ preserveScroll: true })
    )
  })

  test('does not post when role change is cancelled', () => {
    const users = [
      {
        id: 3,
        name: 'Carol',
        email: 'carol@example.com',
        role: 'advisor' as const,
        organization: { id: 12, name: 'Cabinet Gamma' },
        createdAt: '2025-03-01T00:00:00.000Z',
      },
    ]

    render(<UsersAdmin users={users} />)

    const row = screen.getByText('Carol').closest('tr') as HTMLElement
    fireEvent.click(within(row).getByRole('button', { name: /^Super admin$/i }))

    expect(screen.getByRole('dialog', { name: /Modifier le rôle/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^Annuler$/ }))

    expect(postMock).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog', { name: /Modifier le rôle/i })).not.toBeInTheDocument()
  })
})
