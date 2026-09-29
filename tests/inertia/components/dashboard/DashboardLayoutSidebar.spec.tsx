import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import DashboardLayout from '../../../../inertia/components/dashboard/DashboardLayout'

/**
 * #69 — la sidebar s'affiche aussi pour le super admin (liens de supervision),
 * jamais pour un candidat.
 */
const { authState, sidebarProps } = vi.hoisted(() => ({
  authState: { role: 'advisor' as string },
  sidebarProps: [] as Array<{ showSuperAdminLinks?: boolean }>,
}))

vi.mock('../../../../inertia/hooks/use_auth', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'User', role: authState.role },
    logout: vi.fn(),
  }),
}))

vi.mock('../../../../inertia/components/layout/Layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('../../../../inertia/components/dashboard/AdvisorSidebar', () => ({
  AdvisorSidebar: (props: { showSuperAdminLinks?: boolean }) => {
    sidebarProps.push(props)
    return <nav aria-label="sidebar" />
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

describe('DashboardLayout — sidebar selon le rôle', () => {
  beforeEach(() => {
    sidebarProps.length = 0
  })

  test('affiche la sidebar avec les liens super admin pour le super admin', () => {
    authState.role = 'super_admin'
    render(<DashboardLayout>contenu</DashboardLayout>)

    expect(screen.getByRole('navigation', { name: 'sidebar' })).toBeInTheDocument()
    expect(sidebarProps.at(-1)?.showSuperAdminLinks).toBe(true)
  })

  test('affiche la sidebar conseiller pour un advisor', () => {
    authState.role = 'advisor'
    render(<DashboardLayout>contenu</DashboardLayout>)

    expect(screen.getByRole('navigation', { name: 'sidebar' })).toBeInTheDocument()
    expect(sidebarProps.at(-1)?.showSuperAdminLinks).toBe(false)
  })

  test("n'affiche pas de sidebar pour un candidat", () => {
    authState.role = 'employee'
    render(<DashboardLayout>contenu</DashboardLayout>)

    expect(screen.queryByRole('navigation', { name: 'sidebar' })).not.toBeInTheDocument()
    expect(screen.getByText('contenu')).toBeInTheDocument()
  })

  test('hideSidebar masque la sidebar, même pour le super admin', () => {
    authState.role = 'super_admin'
    render(<DashboardLayout hideSidebar>contenu</DashboardLayout>)

    expect(screen.queryByRole('navigation', { name: 'sidebar' })).not.toBeInTheDocument()
  })
})
