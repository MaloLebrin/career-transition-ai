import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import OrganizationsAdmin from '../../../inertia/pages/dashboard/admin/organizations/Index'

vi.mock('../../../inertia/hooks/useAuth', () => ({
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

  /**
   * useForm posts via @inertiajs/core router, not react's router — mock useForm so
   * CreateOrganizationModal exercises real UI while submit hits postMock.
   */
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
      delete: vi.fn(),
    },
  }
})

describe('OrganizationsAdmin page', () => {
  beforeEach(() => {
    postMock.mockClear()
  })

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

  test('does not show create organization dialog until open button is clicked', () => {
    render(<OrganizationsAdmin organizations={[]} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText('Nouvelle organisation')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Créer une organisation/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Nouvelle organisation')).toBeInTheDocument()
  })

  test('calls impersonation endpoint when clicking button', () => {
    const organizations = [
      {
        id: 42,
        name: 'Cabinet Beta',
        slug: 'cabinet-beta',
        usersCount: 2,
        employeesCount: 5,
        createdAt: '2025-02-01T00:00:00.000Z',
      },
    ]

    render(<OrganizationsAdmin organizations={organizations} />)

    const button = screen.getByRole('button', { name: /Impersonation/i })
    fireEvent.click(button)

    expect(postMock).toHaveBeenCalledWith(
      '/auth/impersonate/42',
      undefined,
      expect.objectContaining({ preserveScroll: true })
    )
  })

  test('submits create organization form with owner fields via modal', () => {
    render(<OrganizationsAdmin organizations={[]} />)

    fireEvent.click(screen.getByRole('button', { name: /Créer une organisation/i }))

    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByPlaceholderText('Cabinet Dupont'), {
      target: { value: 'Cabinet Gamma' },
    })
    fireEvent.change(within(dialog).getByPlaceholderText('Jean Dupont'), {
      target: { value: 'Gamma Owner' },
    })
    fireEvent.change(within(dialog).getByPlaceholderText('jean.dupont@cabinet.fr'), {
      target: { value: 'owner@gamma.test' },
    })

    fireEvent.click(screen.getByRole('button', { name: /Créer et inviter/i }))

    expect(postMock).toHaveBeenCalledWith(
      '/dashboard/super-admin/organizations',
      expect.objectContaining({
        name: 'Cabinet Gamma',
        ownerName: 'Gamma Owner',
        ownerEmail: 'owner@gamma.test',
      }),
      expect.any(Object)
    )
  })
})
