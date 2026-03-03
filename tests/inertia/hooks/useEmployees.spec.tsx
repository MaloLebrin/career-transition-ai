import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useEmployees } from '../../../inertia/hooks/useEmployees'

vi.mock('../../../inertia/services/apiService', () => ({
  apiService: {
    fetchEmployees: vi.fn(),
  },
}))

const stableUser = { id: 1, organizationId: 10, role: 'advisor' as const }
vi.mock('../../../inertia/hooks/useAuth', () => ({
  useAuth: () => ({ user: stableUser }),
}))

const { apiService } = await import('../../../inertia/services/apiService')

const mockEmployees = [
  {
    id: 1,
    organizationId: 10,
    name: 'Alice',
    email: 'alice@example.com',
    currentRole: 'Dev',
    skills: [],
    experiences: [],
    educations: [],
    status: 'active' as const,
    onboarded: true,
    exercises: [],
    plan: [],
  },
  {
    id: 2,
    organizationId: 10,
    name: 'Bob',
    email: 'bob@example.com',
    currentRole: 'Designer',
    skills: [],
    experiences: [],
    educations: [],
    status: 'active' as const,
    onboarded: false,
    exercises: [],
    plan: [],
  },
]

describe('useEmployees', () => {
  beforeEach(() => {
    vi.mocked(apiService.fetchEmployees).mockReset()
    vi.mocked(apiService.fetchEmployees).mockResolvedValue(mockEmployees as any)
  })

  test('fetches employees and filters by search term', async () => {
    const { result } = renderHook(() => useEmployees(''))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.employees).toHaveLength(2)
    expect(result.current.filteredEmployees).toHaveLength(2)
    expect(apiService.fetchEmployees).toHaveBeenCalledWith(10, 1)
  })

  test('filteredEmployees filters by name and email', async () => {
    const { result } = renderHook(() => useEmployees('alice'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.filteredEmployees).toHaveLength(1)
    expect(result.current.filteredEmployees[0].name).toBe('Alice')
  })

  test('filteredEmployees is case insensitive', async () => {
    const { result } = renderHook(() => useEmployees('BOB'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.filteredEmployees).toHaveLength(1)
    expect(result.current.filteredEmployees[0].name).toBe('Bob')
  })

  test('sets error when fetch fails', async () => {
    vi.mocked(apiService.fetchEmployees).mockRejectedValue(new Error('Fail'))

    const { result } = renderHook(() => useEmployees(''))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Erreur lors du chargement des candidats.')
    expect(result.current.employees).toEqual([])
  })

  test('refresh re-fetches and updates employees', async () => {
    const { result } = renderHook(() => useEmployees(''))

    await waitFor(() => {
      expect(result.current.employees).toHaveLength(2)
    })

    vi.mocked(apiService.fetchEmployees).mockResolvedValue([mockEmployees[0]] as any)
    await act(async () => {
      result.current.refresh()
    })

    await waitFor(() => {
      expect(result.current.employees).toHaveLength(1)
      expect(result.current.employees[0].name).toBe('Alice')
    })
  })
})
