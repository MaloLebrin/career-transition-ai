import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SuperAdminHome from '../../../inertia/pages/dashboard/SuperAdminHome'

vi.mock('../../../inertia/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Super Admin', role: 'super_admin' as const },
  }),
}))

describe('SuperAdminHome page', () => {
  test('renders stats for super admin', () => {
    render(<SuperAdminHome stats={{ organizations: 3, users: 10 }} />)

    expect(screen.getByText(/Supervision de la plateforme/i)).toBeInTheDocument()
    expect(screen.getByText(/Organisations actives/i)).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText(/Utilisateurs/i)).toBeInTheDocument()
  })
})

