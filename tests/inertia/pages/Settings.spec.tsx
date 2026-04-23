import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Settings from '../../../inertia/pages/dashboard/conseiller/settings/Home'

vi.mock('../../../inertia/hooks/use_auth', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Conseiller', role: 'advisor' as const },
  }),
}))

vi.mock('../../../inertia/hooks/useEmployees', () => ({
  useEmployees: () => ({
    employees: [],
    filteredEmployees: [],
    loading: false,
  }),
}))

vi.mock('@inertiajs/react', async (importOriginal) => {
  const actual = (await importOriginal()) as object
  return {
    ...actual,
    Head: () => null,
    router: { visit: vi.fn() },
    usePage: () => ({ url: '/dashboard/conseiller/settings', props: {} }),
    useForm: (initial: Record<string, unknown>) => ({
      data: initial,
      setData: vi.fn(),
      put: vi.fn(),
      post: vi.fn(),
      processing: false,
      errors: {},
    }),
  }
})

const mockOrganization = {
  id: 1,
  name: 'Mon Cabinet',
  slug: 'mon-cabinet',
  createdAt: '2025-01-01T00:00:00.000Z',
}

const mockMembers: { id: number; organizationId: number; email: string; name: string; role: string }[] = []

describe('Dashboard Settings page', () => {
  test('renders settings page with organization and members without crashing', () => {
    render(<Settings organization={mockOrganization} members={mockMembers} />)

    expect(screen.getByText('Mon Cabinet')).toBeInTheDocument()
    expect(screen.getByText('Mon Profil Personnel')).toBeInTheDocument()
  })

  test('passes members to OrganizationSettings so team is displayed', () => {
    const membersWithOne = [
      { id: 2, organizationId: 1, email: 'collegue@example.com', name: 'Marie Dupont', role: 'consultant' as const },
    ]
    render(<Settings organization={mockOrganization} members={membersWithOne} />)

    expect(screen.getByText('Mon Cabinet')).toBeInTheDocument()
    expect(screen.getByText('Marie Dupont')).toBeInTheDocument()
  })
})
