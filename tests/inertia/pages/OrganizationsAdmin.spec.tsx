import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import OrganizationsAdmin from '../../../inertia/pages/dashboard/OrganizationsAdmin'

vi.mock('../../../inertia/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Super Admin', role: 'super_admin' as const },
  }),
}))

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
})

