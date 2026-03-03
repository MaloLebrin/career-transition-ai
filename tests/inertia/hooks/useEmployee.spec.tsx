import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useEmployee } from '../../../inertia/hooks/useEmployee'

vi.mock('../../../inertia/services/apiService', () => ({
  apiService: {
    fetchEmployeeById: vi.fn(),
  },
}))

const { apiService } = await import('../../../inertia/services/apiService')

const mockEmployee = {
  id: 1,
  organizationId: 1,
  name: 'Jean Dupont',
  email: 'jean@example.com',
  currentRole: 'Dev',
  targetRole: 'Lead',
  skills: [],
  experiences: [],
  educations: [],
  status: 'active' as const,
  onboarded: true,
  exercises: [],
  plan: [],
}

describe('useEmployee', () => {
  beforeEach(() => {
    vi.mocked(apiService.fetchEmployeeById).mockReset()
  })

  test('returns null employee and no loading when id is null', async () => {
    const { result } = renderHook(() => useEmployee(null))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.employee).toBe(null)
    expect(apiService.fetchEmployeeById).not.toHaveBeenCalled()
  })

  test('fetches employee by id and exposes data', async () => {
    vi.mocked(apiService.fetchEmployeeById).mockResolvedValue(mockEmployee as any)

    const { result } = renderHook(() => useEmployee('1'))

    expect(result.current.loading).toBe(true)
    expect(result.current.employee).toBe(null)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.employee).toEqual(mockEmployee)
    expect(result.current.error).toBe(null)
    expect(apiService.fetchEmployeeById).toHaveBeenCalledWith('1')
  })

  test('sets error when fetch fails', async () => {
    vi.mocked(apiService.fetchEmployeeById).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useEmployee('1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.employee).toBe(null)
    expect(result.current.error).toBe('Erreur lors de la récupération du profil.')
  })

  test('refreshEmployee re-fetches', async () => {
    vi.mocked(apiService.fetchEmployeeById).mockResolvedValue(mockEmployee as any)

    const { result } = renderHook(() => useEmployee('1'))

    await waitFor(() => {
      expect(result.current.employee).not.toBe(null)
    })

    vi.mocked(apiService.fetchEmployeeById).mockResolvedValue({
      ...mockEmployee,
      name: 'Updated',
    } as any)

    await act(async () => {
      result.current.refreshEmployee()
    })

    await waitFor(() => {
      expect(result.current.employee?.name).toBe('Updated')
    })
    expect(apiService.fetchEmployeeById).toHaveBeenCalledTimes(2)
  })
})
