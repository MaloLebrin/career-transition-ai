import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ExercisesUsageAdmin from '../../../inertia/pages/dashboard/ExercisesUsageAdmin'

vi.mock('../../../inertia/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Super Admin', role: 'super_admin' as const },
  }),
}))

const getMock = vi.fn()

vi.mock('@inertiajs/react', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    router: {
      ...actual.router,
      get: getMock,
    },
  }
})

describe('ExercisesUsageAdmin page', () => {
  test('renders usage table for super admin', () => {
    const props = {
      filters: {
        from: '2025-01-01',
        to: '2025-01-31',
        organizationId: null,
      },
      organizationsOptions: [
        { id: 1, name: 'Cabinet Alpha' },
        { id: 2, name: 'Cabinet Beta' },
      ],
      organizations: [
        {
          id: 1,
          name: 'Cabinet Alpha',
          totalsByType: {
            motivation: 3,
            values: 1,
          },
          totalExercises: 4,
        },
      ],
    }

    render(<ExercisesUsageAdmin {...props} />)

    expect(screen.getByText(/Usage des exercices par organisation/i)).toBeInTheDocument()
    expect(screen.getByText('Cabinet Alpha')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  test('submits filters via router.get', () => {
    const props = {
      filters: {
        from: '2025-01-01',
        to: '2025-01-31',
        organizationId: null,
      },
      organizationsOptions: [{ id: 1, name: 'Cabinet Alpha' }],
      organizations: [],
    }

    render(<ExercisesUsageAdmin {...props} />)

    const fromInput = screen.getByLabelText(/Du/i)
    const toInput = screen.getByLabelText(/Au/i)
    const submitButton = screen.getByRole('button', { name: /Mettre à jour/i })

    fireEvent.change(fromInput, { target: { value: '2025-02-01' } })
    fireEvent.change(toInput, { target: { value: '2025-02-28' } })
    fireEvent.click(submitButton)

    expect(getMock).toHaveBeenCalledWith(
      '/dashboard/super-admin/exercises-usage',
      expect.objectContaining({
        from: '2025-02-01',
        to: '2025-02-28',
      }),
      expect.objectContaining({ preserveState: true, preserveScroll: true })
    )
  })

  test('clicking organization row triggers drill-down navigation', () => {
    const props = {
      filters: {
        from: '2025-01-01',
        to: '2025-01-31',
        organizationId: null,
      },
      organizationsOptions: [{ id: 1, name: 'Cabinet Alpha' }],
      organizations: [
        {
          id: 1,
          name: 'Cabinet Alpha',
          totalsByType: { motivation: 2 },
          totalExercises: 2,
        },
      ],
    }

    render(<ExercisesUsageAdmin {...props} />)

    const rowNameCell = screen.getByText('Cabinet Alpha')
    fireEvent.click(rowNameCell)

    expect(getMock).toHaveBeenCalledWith(
      '/dashboard/super-admin/exercises-usage',
      expect.objectContaining({
        from: '2025-01-01',
        to: '2025-01-31',
        organizationId: '1',
      }),
      expect.objectContaining({ preserveState: true, preserveScroll: true })
    )
  })

  test('clicking Export CSV changes window.location.href', () => {
    const props = {
      filters: {
        from: '2025-01-01',
        to: '2025-01-31',
        organizationId: null,
      },
      organizationsOptions: [],
      organizations: [],
    }

    const originalLocation = window.location
    // @ts-expect-error override for test
    delete (window as any).location
    ;(window as any).location = { href: '' }

    render(<ExercisesUsageAdmin {...props} />)

    const exportButton = screen.getByRole('button', { name: /Export CSV/i })
    fireEvent.click(exportButton)

    expect(window.location.href).toContain(
      '/dashboard/super-admin/exercises-usage/export?from=2025-01-01&to=2025-01-31'
    )

    window.location = originalLocation
  })
})
