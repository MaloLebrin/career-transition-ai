import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import StepDetail from '../../../../../../inertia/pages/dashboard/conseiller/employees/StepDetail'
import { useAuth } from '../../../../../../inertia/hooks/use_auth'

vi.mock('@inertiajs/react', async (importOriginal) => {
  const actual = (await importOriginal()) as object
  return {
    ...actual,
    Head: () => null,
    router: { visit: vi.fn() },
  }
})

vi.mock('../../../../../../inertia/hooks/use_auth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../../../../../inertia/components/dashboard/DashboardLayout', () => ({
  default: ({
    children,
    selectedEmployeeId,
  }: {
    children: React.ReactNode
    selectedEmployeeId?: string
  }) => (
    <div data-testid="layout" data-selected-employee-id={selectedEmployeeId ?? ''}>
      {children}
    </div>
  ),
}))

vi.mock('../../../../../../inertia/components/ui/Breadcrumb', () => ({
  default: () => <nav data-testid="breadcrumb" />,
}))

vi.mock('../../../../../../inertia/components/ui/Badge', () => ({
  default: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

vi.mock('../../../../../../inertia/components/exercises/ExerciseResultVisualization', () => ({
  default: () => <div data-testid="result-vis" />,
}))

vi.mock('../../../../../../inertia/components/dashboard/NotesSection', () => ({
  default: () => <section data-testid="notes" />,
}))

vi.mock('../../../../../../inertia/components/ui/LinkActions', () => ({
  default: ({ value }: { value: string }) => <div data-testid="link-actions">{value}</div>,
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

describe('Dashboard conseiller employees StepDetail page', () => {
  beforeEach(async () => {
    const inertia = await import('@inertiajs/react')
    ;(inertia.router.visit as any).mockClear()
  })

  test('renders without crashing when unauthenticated', async () => {
    setAuthUser(null)
    render(<StepDetail employeeId="42" employeeName="Jean" step={stepBase as any} results={[]} />)
    const inertia = await import('@inertiajs/react')
    expect(inertia.router.visit).not.toHaveBeenCalled()
    expect(screen.getByTestId('layout')).toBeInTheDocument()
  })

  test('passes selectedEmployeeId to layout', () => {
    setAuthUser({ id: 1, role: 'advisor' })
    render(<StepDetail employeeId="42" employeeName="Jean" step={stepBase as any} results={[]} />)
    expect(screen.getByTestId('layout')).toHaveAttribute('data-selected-employee-id', '42')
  })

  test('renders locationOrLink and does not show LinkActions when not a URL', () => {
    setAuthUser({ id: 1, role: 'advisor' })
    render(<StepDetail employeeId="42" employeeName="Jean" step={stepBase as any} results={[]} />)
    expect(screen.getByText('Bureau Paris')).toBeInTheDocument()
    expect(screen.queryByTestId('link-actions')).not.toBeInTheDocument()
  })

  test('shows LinkActions when locationOrLink is a URL', () => {
    setAuthUser({ id: 1, role: 'advisor' })
    render(
      <StepDetail
        employeeId="42"
        employeeName="Jean"
        step={{ ...stepBase, locationOrLink: 'https://example.com/meet' } as any}
        results={[]}
      />
    )
    expect(screen.getAllByText('https://example.com/meet').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByTestId('link-actions')).toHaveTextContent('https://example.com/meet')
  })
})
