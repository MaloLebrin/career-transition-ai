import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import OrganizationsAdmin from '../../../inertia/pages/dashboard/admin/organizations/Index'

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
      delete: vi.fn(),
    },
  }
})

describe('OrganizationsAdmin page', () => {
  test('renders organizations table for super admin', () => {
    const organizations = [
      {
        id: 1,
        name: 'Cabinet Alpha',
        slug: 'cabinet-alpha',
        usersCount: 3,
        employeesCount: 10,
        createdAt: '2025-01-01T00:00:00.000Z',
      },
    ]

    render(<OrganizationsAdmin organizations={organizations} />)

    expect(screen.getByText(/Organisations clientes/i)).toBeInTheDocument()
    expect(screen.getByText('Cabinet Alpha')).toBeInTheDocument()
    expect(screen.getByText('cabinet-alpha')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  test('calls impersonation endpoint when clicking button', () => {
    const organizations = [
      {
        id: 42,
        name: 'Cabinet Beta',
        slug: 'cabinet-beta',
        usersCount: 2,
        employeesCount: 5,
        createdAt: '2025-02-01T00:00:00.000Z',
      },
    ]

    render(<OrganizationsAdmin organizations={organizations} />)

    const button = screen.getByRole('button', { name: /Impersonation/i })
    fireEvent.click(button)

    expect(postMock).toHaveBeenCalledWith(
      '/auth/impersonate/42',
      undefined,
      expect.objectContaining({ preserveScroll: true })
    )
  })

  test('submits create organization form with owner fields', () => {
    render(<OrganizationsAdmin organizations={[]} />)

    fireEvent.change(screen.getByPlaceholderText('Nom du cabinet'), {
      target: { value: 'Cabinet Gamma' },
    })
    fireEvent.change(screen.getByPlaceholderText('Nom du propriétaire'), {
      target: { value: 'Gamma Owner' },
    })
    fireEvent.change(screen.getByPlaceholderText('Email du propriétaire'), {
      target: { value: 'owner@gamma.test' },
    })

    fireEvent.click(screen.getByRole('button', { name: /Ajouter/i }))

    expect(postMock).toHaveBeenCalledWith(
      '/dashboard/super-admin/organizations',
      expect.objectContaining({
        name: 'Cabinet Gamma',
        ownerName: 'Gamma Owner',
        ownerEmail: 'owner@gamma.test',
      }),
      expect.any(Object)
    )
  })
})
