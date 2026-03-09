import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import UsersAdmin from '../../../inertia/pages/dashboard/UsersAdmin'

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

  test('filters by role and triggers role change', () => {
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

    const makeAdminButton = screen.getByRole('button', { name: /Admin orga/i })
    fireEvent.click(makeAdminButton)

    expect(postMock).toHaveBeenCalledWith(
      '/dashboard/super-admin/users/2/role',
      { role: 'admin' },
      expect.objectContaining({ preserveScroll: true })
    )
  })
})
