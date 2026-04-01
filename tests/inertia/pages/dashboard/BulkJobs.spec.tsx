import { describe, test, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import BulkJobs from '../../../../inertia/pages/dashboard/admin/jobs/Index'

vi.mock('../../../../inertia/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, role: 'super_admin' as const, name: 'Super Admin' },
  }),
}))

vi.mock('@inertiajs/react', () => ({
  Head: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}))

vi.mock('../../../../inertia/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock Transmit client to avoid real SSE connections in tests
const subscriptionCreateMock = vi.fn().mockResolvedValue(undefined)
const subscriptionOnMessageMock = vi.fn().mockReturnValue(() => {})
const subscriptionDeleteMock = vi.fn().mockResolvedValue(undefined)

vi.mock('@adonisjs/transmit-client', () => {
  return {
    Transmit: vi.fn().mockImplementation(() => ({
      subscription: () => ({
        create: subscriptionCreateMock,
        onMessage: subscriptionOnMessageMock,
        delete: subscriptionDeleteMock,
      }),
    })),
  }
})

describe('BulkJobs page', () => {
  test('renders table and empty state message', () => {
    // Mock fetch to return empty list
    const fetchMock = vi.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => [],
    } as any)

    render(<BulkJobs />)

    expect(
      screen.getByText(/Tâches en arrière-plan/i)
    ).toBeInTheDocument()

    // After initial load, empty state message should appear
    return waitFor(() => {
      expect(
        screen.getByText(/Aucun job en arrière-plan pour le moment/i)
      ).toBeInTheDocument()
    })

    // Note: fetch is used by the page implementation; call details are not asserted here.
  })
})

