import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SuperAdminHome from '../../../inertia/pages/dashboard/admin/home/Home'

vi.mock('../../../inertia/hooks/use_auth', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Super Admin', role: 'super_admin' as const },
  }),
}))

vi.mock('@inertiajs/react', () => ({
  Head: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}))

vi.mock('../../../inertia/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('SuperAdminHome page', () => {
  test('renders stats for super admin', () => {
    render(
      <SuperAdminHome
        stats={{
          organizations: 3,
          users: 10,
          b2c: {
            candidates: 7,
            paid: 2,
            monthRevenueCents: 9800,
            currency: 'eur',
            pendingExpertRequests: 1,
          },
        }}
      />
    )

    expect(screen.getByText(/Supervision de la plateforme/i)).toBeInTheDocument()
    expect(screen.getByText(/Organisations actives/i)).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getAllByText(/Utilisateurs/i).length).toBeGreaterThanOrEqual(1)
  })

  test('affiche les indicateurs B2C (#107)', () => {
    render(
      <SuperAdminHome
        stats={{
          organizations: 3,
          users: 10,
          b2c: {
            candidates: 7,
            paid: 2,
            monthRevenueCents: 9800,
            currency: 'eur',
            pendingExpertRequests: 1,
          },
        }}
      />
    )

    expect(
      screen.getByRole('heading', { level: 2, name: 'Particuliers (B2C)' })
    ).toBeInTheDocument()
    expect(screen.getByRole('article', { name: '7 Inscrits' })).toBeInTheDocument()
    expect(screen.getByRole('article', { name: '2 Forfaits réglés' })).toBeInTheDocument()
    expect(
      screen.getByRole('article', { name: /98.*Chiffre d’affaires du mois/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('article', { name: '1 Demandes d’accompagnement en attente' })
    ).toBeInTheDocument()
  })
})
