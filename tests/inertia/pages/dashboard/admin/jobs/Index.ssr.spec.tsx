/**
 * SSR runs in Node without `window`; PDF exports list must not touch `window` during render.
 * @vitest-environment node
 */
import { renderToString } from 'react-dom/server'
import { describe, expect, test, vi } from 'vitest'
import PdfExportsList from '../../../../../../inertia/pages/dashboard/admin/jobs/Index'

vi.mock('../../../../../../inertia/hooks/use_auth', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Advisor', role: 'advisor' as const },
    logout: vi.fn(),
  }),
}))

vi.mock('@inertiajs/react', () => ({
  Head: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}))

vi.mock('../../../../../../inertia/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@adonisjs/transmit-client', () => ({
  Transmit: vi.fn(),
}))

describe('Pdf exports list (admin jobs Index)', () => {
  test('renders on the server without referencing window', () => {
    expect(typeof globalThis.window).toBe('undefined')
    const html = renderToString(<PdfExportsList exports={[]} />)
    expect(html).toMatch(/Exports PDF/i)
  })
})
