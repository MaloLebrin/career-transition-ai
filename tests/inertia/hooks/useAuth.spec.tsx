import { describe, test, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../../../inertia/hooks/use_auth'

const mockSession = {
  id: 1,
  organizationId: 10,
  email: 'user@example.com',
  name: 'Test User',
  role: 'advisor' as const,
}

const mockCsrfToken = 'test-csrf-token'

const mockRouterVisit = vi.fn()
const mockRouterPost = vi.fn()
const mockUsePage = vi.fn(() => ({ props: { csrfToken: mockCsrfToken, user: mockSession } }))

vi.mock('@inertiajs/react', () => ({
  usePage: (...args: unknown[]) => mockUsePage(...args),
  router: {
    visit: (...args: unknown[]) => mockRouterVisit(...args),
    post: (...args: unknown[]) => mockRouterPost(...args),
  },
}))

describe('useAuth', () => {
  test('logout clears user and redirects to login', async () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.user).toEqual(mockSession)

    await act(async () => {
      await result.current.logout()
    })

    expect(mockRouterPost).toHaveBeenCalledWith(
      '/auth/logout',
      { _csrf: mockCsrfToken },
      expect.any(Object)
    )
    const options = mockRouterPost.mock.calls[0][2] as { onFinish: () => void }
    await options.onFinish()
    expect(mockRouterVisit).toHaveBeenCalledWith('/auth/login')
  })
})
