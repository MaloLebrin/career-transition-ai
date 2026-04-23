import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import OrganizationSettings from '../../../inertia/components/settings/OrganizationSettings'

const mockOnBack = vi.fn()

vi.mock('../../../inertia/hooks/use_auth', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Conseiller Test', email: 'advisor@example.com', role: 'advisor' as const },
  }),
}))

vi.mock('@inertiajs/react', () => ({
  useForm: (initial: Record<string, unknown>) => ({
    data: initial,
    setData: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    processing: false,
    errors: {},
  }),
}))

const mockOrganization = {
  id: 1,
  name: 'Mon Cabinet',
  slug: 'mon-cabinet',
  createdAt: '2025-01-01T00:00:00.000Z',
}

const mockMembers: { id: number; organizationId: number; email: string; name: string; role: string }[] = [
  { id: 1, organizationId: 1, email: 'advisor@example.com', name: 'Conseiller Test', role: 'expert' },
]

describe('OrganizationSettings', () => {
  test('renders cabinet content when organization and members are passed as props', () => {
    render(
      <OrganizationSettings
        organization={mockOrganization}
        members={mockMembers}
        onBack={mockOnBack}
      />
    )

    expect(screen.getByText('Mon Cabinet')).toBeInTheDocument()
    expect(screen.getByText('Mon Profil Personnel')).toBeInTheDocument()
    expect(screen.getByText('Identité visuelle et gestion d\'équipe')).toBeInTheDocument()
    expect(screen.getByText('Mon Équipe')).toBeInTheDocument()
  })

  test('renders with empty members list and shows no collaborator message', () => {
    render(
      <OrganizationSettings
        organization={mockOrganization}
        members={[]}
        onBack={mockOnBack}
      />
    )

    expect(screen.getByText('Mon Cabinet')).toBeInTheDocument()
    expect(screen.getByText(/Aucun collaborateur trouvé/i)).toBeInTheDocument()
  })

  test('shows loading spinner when organization is not provided', () => {
    const { container } = render(
      <OrganizationSettings onBack={mockOnBack} />
    )

    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
    expect(screen.queryByText('Mon Cabinet')).not.toBeInTheDocument()
  })
})
