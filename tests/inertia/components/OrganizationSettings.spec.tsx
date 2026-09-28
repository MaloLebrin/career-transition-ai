import { beforeEach, describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import OrganizationSettings from '../../../inertia/components/settings/OrganizationSettings'

const mockOnBack = vi.fn()

let currentRole: string = 'advisor'

vi.mock('../../../inertia/hooks/use_auth', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      name: 'Conseiller Test',
      email: 'advisor@example.com',
      role: currentRole,
    },
  }),
}))

vi.mock('@inertiajs/react', () => ({
  router: { delete: vi.fn() },
  useForm: (initial: Record<string, unknown>) => ({
    data: initial,
    setData: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    reset: vi.fn(),
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

const mockMembers: {
  id: number
  organizationId: number
  email: string
  name: string
  role: string
}[] = [
  {
    id: 1,
    organizationId: 1,
    email: 'advisor@example.com',
    name: 'Conseiller Test',
    role: 'expert',
  },
]

describe('OrganizationSettings', () => {
  beforeEach(() => {
    currentRole = 'advisor'
  })

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
    expect(screen.getByText("Identité visuelle et gestion d'équipe")).toBeInTheDocument()
    expect(screen.getByText('Mon Équipe')).toBeInTheDocument()
  })

  test('renders with empty members list and shows no collaborator message', () => {
    render(
      <OrganizationSettings organization={mockOrganization} members={[]} onBack={mockOnBack} />
    )

    expect(screen.getByText('Mon Cabinet')).toBeInTheDocument()
    expect(screen.getByText(/Aucun collaborateur trouvé/i)).toBeInTheDocument()
  })

  test('shows loading spinner when organization is not provided', () => {
    const { container } = render(<OrganizationSettings onBack={mockOnBack} />)

    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
    expect(screen.queryByText('Mon Cabinet')).not.toBeInTheDocument()
  })

  /** Régression : l'organisation était figée dans un useState, le nouveau logo n'apparaissait pas. */
  test('affiche le logo renvoyé par Inertia après un upload', () => {
    const { rerender } = render(
      <OrganizationSettings
        organization={mockOrganization}
        members={mockMembers}
        onBack={mockOnBack}
      />
    )
    expect(screen.queryByAltText('Logo du cabinet')).not.toBeInTheDocument()

    rerender(
      <OrganizationSettings
        organization={{ ...mockOrganization, logoUrl: 'https://res.test/logo.png' }}
        members={mockMembers}
        onBack={mockOnBack}
      />
    )

    expect(screen.getByAltText('Logo du cabinet')).toHaveAttribute(
      'src',
      'https://res.test/logo.png'
    )
  })

  /** #61 : les modifications du cabinet sont réservées aux admins (middleware.admin()). */
  test.each(['advisor', 'expert'])('%s : infos et logo en lecture seule', (role) => {
    currentRole = role
    render(
      <OrganizationSettings
        organization={mockOrganization}
        members={mockMembers}
        onBack={mockOnBack}
      />
    )

    expect(screen.queryByText('Mettre à jour les infos')).not.toBeInTheDocument()
    expect(screen.getAllByText(/Seul un administrateur du cabinet/)).toHaveLength(2)
    expect(screen.queryByLabelText('Choisir un logo')).not.toBeInTheDocument()
  })

  test('admin : infos et logo modifiables', () => {
    currentRole = 'admin'
    render(
      <OrganizationSettings
        organization={mockOrganization}
        members={mockMembers}
        onBack={mockOnBack}
      />
    )

    expect(screen.queryByText(/Seul un administrateur du cabinet/)).not.toBeInTheDocument()
    expect(screen.getByText('Mettre à jour les infos')).toBeInTheDocument()
    expect(screen.getByLabelText('Choisir un logo')).toBeInTheDocument()
  })
})
