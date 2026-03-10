import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useAuth } from '../../../inertia/hooks/useAuth'

const mockSession = {
  id: 1,
  organizationId: 10,
  email: 'user@example.com',
  name: 'Test User',
  role: 'advisor' as const,
}

const mockCsrfToken = 'test-csrf-token'

const mockRouterVisit = vi.fn()
vi.mock('@inertiajs/react', () => ({
  usePage: vi.fn(() => ({ props: { csrfToken: mockCsrfToken } })),
  router: { visit: (...args: unknown[]) => mockRouterVisit(...args) },
}))

vi.mock('../../../inertia/services/authService', () => ({
  authService: {
    getCurrentSession: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}))

const { authService } = await import('../../../inertia/services/authService')

describe('useAuth', () => {
  beforeEach(() => {
    vi.mocked(authService.getCurrentSession).mockResolvedValue(null as any)
    vi.mocked(authService.login).mockReset()
    vi.mocked(authService.register).mockReset()
    vi.mocked(authService.logout).mockReset()
    mockRouterVisit.mockReset()
  })

  test('starts with loading then no user when no session', async () => {
    vi.mocked(authService.getCurrentSession).mockResolvedValue(null as any)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.user).toBe(null)
  })

  test('starts with user when getCurrentSession returns session', async () => {
    vi.mocked(authService.getCurrentSession).mockResolvedValue(mockSession as any)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.user).toEqual(mockSession)
  })

  test('login updates user on success', async () => {
    vi.mocked(authService.login).mockResolvedValue(mockSession as any)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.login('user@example.com', 'password')
    })

    expect(result.current.user).toEqual(mockSession)
    expect(authService.login).toHaveBeenCalledWith('user@example.com', 'password', mockCsrfToken)
  })

  test('login sets error on failure', async () => {
    vi.mocked(authService.login).mockRejectedValue(new Error('Invalid credentials'))

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      try {
        await result.current.login('bad@example.com', 'wrong')
      } catch {
        // expected
      }
    })

    expect(result.current.error).toBe('Invalid credentials')
  })

  test('logout clears user and redirects to login', async () => {
    vi.mocked(authService.getCurrentSession).mockResolvedValue(mockSession as any)
    vi.mocked(authService.logout).mockResolvedValue(undefined)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.user).toEqual(mockSession)
    })

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.user).toBe(null)
    expect(authService.logout).toHaveBeenCalledWith(mockCsrfToken)
    expect(mockRouterVisit).toHaveBeenCalledWith('/auth/login')
  })

  test('register updates user on success', async () => {
    vi.mocked(authService.register).mockResolvedValue(mockSession as any)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.register('new@example.com', 'secret', 'New User', 'New Org')
    })

    expect(result.current.user).toEqual(mockSession)
    expect(authService.register).toHaveBeenCalledWith(
      'new@example.com',
      'secret',
      'New User',
      'New Org',
      'advisor',
      mockCsrfToken
    )
  })
})
