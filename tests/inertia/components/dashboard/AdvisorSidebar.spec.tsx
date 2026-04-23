import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { AdvisorSidebar } from '../../../../inertia/components/dashboard/AdvisorSidebar'

vi.mock('../../../../inertia/hooks/use_employees', () => ({
  useEmployees: () => ({
    employees: [],
    filteredEmployees: [],
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}))

vi.mock('@inertiajs/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@inertiajs/react')>()
  return {
    ...actual,
    usePage: () => ({
      url: '/dashboard/conseiller/employees',
      props: { employees: [] },
    }),
  }
})

describe('AdvisorSidebar', () => {
  test('super admin sees Supervision section with platform links and Design, not conseiller nav or candidate list', () => {
    render(<AdvisorSidebar showSuperAdminLinks />)

    expect(screen.getByText('Supervision')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Supervision Plateforme/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^Organisations$/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^Design$/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^Exports PDF$/ })).toHaveAttribute(
      'href',
      '/dashboard/super-admin/pdf-exports'
    )

    expect(screen.queryByText('Navigation')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^Bureau$/ })).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Filtrer...')).not.toBeInTheDocument()
  })

  test('advisor sees Navigation and candidate list, not super-admin-only links', () => {
    render(<AdvisorSidebar showSuperAdminLinks={false} />)

    expect(screen.getByText('Navigation')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^Bureau$/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^Tâches$/ })).toHaveAttribute(
      'href',
      '/dashboard/conseiller/pdf-exports'
    )
    expect(screen.getByPlaceholderText('Filtrer...')).toBeInTheDocument()

    expect(screen.queryByRole('link', { name: /^Organisations$/ })).not.toBeInTheDocument()
    expect(screen.queryByText('Supervision')).not.toBeInTheDocument()
  })
})
