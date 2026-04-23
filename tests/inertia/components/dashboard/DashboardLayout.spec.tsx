/**
 * SSR runs in Node without `window`; DashboardLayout must not touch `window` during render.
 * @vitest-environment node
 */
import { renderToString } from 'react-dom/server'
import { describe, expect, test, vi } from 'vitest'
import DashboardLayout from '../../../../inertia/components/dashboard/DashboardLayout'

vi.mock('../../../../inertia/hooks/use_auth', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Advisor', role: 'advisor' as const },
    logout: vi.fn(),
  }),
}))

vi.mock('../../../../inertia/components/layout/Layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('../../../../inertia/components/dashboard/AdvisorSidebar', () => ({
  AdvisorSidebar: () => null,
}))

describe('DashboardLayout', () => {
  test('renders on the server without referencing window', () => {
    expect(typeof globalThis.window).toBe('undefined')
    const html = renderToString(
      <DashboardLayout>
        <span>child</span>
      </DashboardLayout>
    )
    expect(html).toContain('child')
  })
})
