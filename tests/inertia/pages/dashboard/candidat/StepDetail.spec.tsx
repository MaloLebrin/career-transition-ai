import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import StepDetail from '../../../../../inertia/pages/dashboard/candidat/StepDetail'
import { useAuth } from '../../../../../inertia/hooks/useAuth'

vi.mock('@inertiajs/react', async (importOriginal) => {
  const actual = (await importOriginal()) as object
  return {
    ...actual,
    Head: () => null,
    router: { visit: vi.fn() },
  }
})

vi.mock('../../../../../inertia/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../../../../inertia/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}))

vi.mock('../../../../../inertia/components/ui/Breadcrumb', () => ({
  default: () => <nav data-testid="breadcrumb" />,
}))

vi.mock('../../../../../inertia/components/ui/Badge', () => ({
  default: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

vi.mock('../../../../../inertia/components/exercises/ExerciseResultVisualization', () => ({
  default: () => <div data-testid="result-vis" />,
}))

function setAuthUser(user: any) {
  vi.mocked(useAuth).mockReturnValue({ user } as any)
}

const stepBase = {
  id: 1,
  sortOrder: 0,
  completed: false,
  scheduledAt: '2026-03-18T10:00:00.000Z',
  instructions: 'Préparez vos questions',
  locationOrLink: 'Bureau Paris',
  associatedExercises: [],
}

describe('Dashboard candidat StepDetail page', () => {
  beforeEach(async () => {
    const inertia = await import('@inertiajs/react')
    ;(inertia.router.visit as any).mockClear()
  })

  test('redirects to login and shows spinner when unauthenticated', async () => {
    setAuthUser(null)
    render(<StepDetail step={stepBase as any} results={[]} />)
    const inertia = await import('@inertiajs/react')
    expect(inertia.router.visit).toHaveBeenCalledWith('/auth/login')
    expect(screen.getByTestId('layout')).toBeInTheDocument()
  })

  test('renders session info including locationOrLink as text', () => {
    setAuthUser({ id: 1, role: 'employee' })
    render(<StepDetail step={stepBase as any} results={[]} />)
    expect(screen.getByText('Lieu / Lien')).toBeInTheDocument()
    expect(screen.getByText('Bureau Paris')).toBeInTheDocument()
  })
})

