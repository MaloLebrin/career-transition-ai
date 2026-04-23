import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import UsersAdmin from '../../../inertia/pages/dashboard/admin/users/Index'

vi.mock('../../../inertia/hooks/use_auth', () => ({
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
  const React = await import('react')

  function useFormMock(initial: Record<string, unknown>) {
    const [data, setDataState] = React.useState(() => ({ ...initial }))
    const dataRef = React.useRef(data)
    const transformRef = React.useRef<(d: Record<string, unknown>) => Record<string, unknown>>(
      (d) => d
    )

    React.useEffect(() => {
      dataRef.current = data
    }, [data])

    const setData = React.useCallback((key: string, value: unknown) => {
      setDataState((prev) => {
        const next = { ...prev, [key]: value }
        dataRef.current = next
        return next
      })
    }, [])

    const reset = React.useCallback(() => {
      const next = { ...initial }
      setDataState(next)
      dataRef.current = next
    }, [initial])

    const transform = React.useCallback(
      (cb: (d: Record<string, unknown>) => Record<string, unknown>) => {
        transformRef.current = cb
      },
      []
    )

    const post = React.useCallback((url: string, options: Record<string, unknown> = {}) => {
      const transformed = transformRef.current({ ...dataRef.current })
      postMock(url, transformed, options)
    }, [])

    return {
      data,
      setData,
      post,
      processing: false,
      errors: {},
      reset,
      transform,
    }
  }

  return {
    ...actual,
    Head: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    useForm: useFormMock,
    router: {
      ...actual.router,
      post: postMock,
    },
  }
})

const defaultOrgs = [{ id: 10, name: 'Cabinet Alpha', slug: 'cabinet-alpha' }]

describe('UsersAdmin page', () => {
  beforeEach(() => {
    postMock.mockClear()
  })

  test('renders users table for super admin', () => {
    const users = [
      {
        id: 1,
        name: 'Alice',
        email: 'alice@example.com',
        role: 'advisor' as const,
        organization: { id: 10, name: 'Cabinet Alpha' },
        createdAt: '2025-01-01T00:00:00.000Z',
        onboardingCompleted: true,
      },
    ]

    render(<UsersAdmin users={users} organizations={defaultOrgs} />)

    expect(screen.getByText(/Utilisateurs de la plateforme/i)).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    expect(screen.getByText('Cabinet Alpha')).toBeInTheDocument()
    expect(screen.getByText('Actif')).toBeInTheDocument()
  })

  test('opens confirmation modal then posts role change on confirm', () => {
    const users = [
      {
        id: 2,
        name: 'Bob',
        email: 'bob@example.com',
        role: 'employee' as const,
        organization: { id: 11, name: 'Cabinet Beta' },
        createdAt: '2025-02-01T00:00:00.000Z',
        onboardingCompleted: true,
      },
    ]

    render(<UsersAdmin users={users} organizations={defaultOrgs} />)

    const filterSelect = screen.getByDisplayValue('Tous les rôles')
    fireEvent.change(filterSelect, { target: { value: 'employee' } })

    const row = screen.getByText('Bob').closest('tr') as HTMLElement
    const roleSelect = within(row).getByRole('combobox', { name: /Changer le rôle de Bob/i })
    fireEvent.change(roleSelect, { target: { value: 'admin' } })

    const dialog = screen.getByRole('dialog', { name: /Modifier le rôle/i })
    expect(dialog).toBeInTheDocument()
    expect(
      within(dialog).getByText(/Vous allez passer Bob du rôle « Talent » au rôle « Admin orga »/)
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Confirmer le changement/i }))

    expect(postMock).toHaveBeenCalledWith(
      '/dashboard/super-admin/users/2/role',
      { role: 'admin' },
      expect.objectContaining({ preserveScroll: true })
    )
  })

  test('does not post when role change is cancelled', () => {
    const users = [
      {
        id: 3,
        name: 'Carol',
        email: 'carol@example.com',
        role: 'advisor' as const,
        organization: { id: 12, name: 'Cabinet Gamma' },
        createdAt: '2025-03-01T00:00:00.000Z',
        onboardingCompleted: true,
      },
    ]

    render(<UsersAdmin users={users} organizations={defaultOrgs} />)

    const row = screen.getByText('Carol').closest('tr') as HTMLElement
    const roleSelect = within(row).getByRole('combobox', { name: /Changer le rôle de Carol/i })
    fireEvent.change(roleSelect, { target: { value: 'super_admin' } })

    expect(screen.getByRole('dialog', { name: /Modifier le rôle/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^Annuler$/ }))

    expect(postMock).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog', { name: /Modifier le rôle/i })).not.toBeInTheDocument()
  })

  test('posts resend onboarding when user not completed', () => {
    const users = [
      {
        id: 4,
        name: 'Dan',
        email: 'dan@example.com',
        role: 'advisor' as const,
        organization: { id: 10, name: 'Cabinet Alpha' },
        createdAt: '2025-04-01T00:00:00.000Z',
        onboardingCompleted: false,
      },
    ]

    render(<UsersAdmin users={users} organizations={defaultOrgs} />)

    expect(screen.getByText('En attente')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Renvoyer l.invitation/i }))

    expect(postMock).toHaveBeenCalledWith(
      '/dashboard/super-admin/users/4/resend-onboarding',
      {},
      expect.objectContaining({ preserveScroll: true })
    )
  })

  test('opens create user modal from header button', () => {
    render(<UsersAdmin users={[]} organizations={defaultOrgs} />)

    fireEvent.click(screen.getByRole('button', { name: /Créer un utilisateur/i }))

    expect(screen.getByRole('dialog', { name: /Nouvel utilisateur/i })).toBeInTheDocument()
  })
})
