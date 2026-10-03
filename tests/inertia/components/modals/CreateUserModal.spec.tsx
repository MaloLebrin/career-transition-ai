import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { ROLE_LABELS } from '#shared/helpers/roles'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { CreateUserModal } from '../../../../inertia/components/modals/CreateUserModal'

vi.mock('@inertiajs/react', () => ({
  useForm: () => ({
    data: { organizationId: '', name: '', email: '', role: 'advisor' },
    setData: vi.fn(),
    post: vi.fn(),
    processing: false,
    errors: {},
    reset: vi.fn(),
    transform: vi.fn(),
  }),
}))

const organizations = [{ id: 1, name: 'Cabinet A', slug: 'cabinet-a' }]

describe('CreateUserModal', () => {
  test('returns null when closed', () => {
    const { container } = render(
      <CreateUserModal isOpen={false} onClose={vi.fn()} organizations={organizations} />
    )
    expect(container.firstChild).toBeNull()
  })

  /** Régression #96 : un candidat se crée par un conseiller ou par inscription, jamais ici. */
  test('propose conseiller, admin et expert, jamais candidat ni super admin', () => {
    render(<CreateUserModal isOpen onClose={vi.fn()} organizations={organizations} />)

    const options = screen
      .getAllByRole('option')
      .map((option) => option.textContent)
      .filter((label) => label !== 'Choisir un cabinet…' && label !== 'Cabinet A')

    expect(options).toEqual([
      ROLE_LABELS[USERS_ROLES.ADVISOR],
      ROLE_LABELS[USERS_ROLES.ADMIN],
      ROLE_LABELS[USERS_ROLES.EXPERT],
    ])
    expect(options).not.toContain(ROLE_LABELS[USERS_ROLES.EMPLOYEE])
  })

  test('sans organisation cliente : invite à en créer une', () => {
    render(<CreateUserModal isOpen onClose={vi.fn()} organizations={[]} />)
    expect(screen.getByText(/Aucune organisation cliente disponible/)).toBeInTheDocument()
  })
})
