import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

import ExerciseHome from '../../../../../../inertia/pages/dashboard/employee/exercises/Home'
import type { Employee } from '../../../../../../inertia/types'

const { useEmployeeSpy } = vi.hoisted(() => ({ useEmployeeSpy: vi.fn() }))
const { lifeCurveToolSpy } = vi.hoisted(() => ({ lifeCurveToolSpy: vi.fn() }))

vi.mock('../../../../../../inertia/hooks/use_employee', () => ({
  useEmployee: (id: unknown, initial?: Employee | null) => useEmployeeSpy(id, initial),
}))

vi.mock('@inertiajs/react', () => ({
  Head: () => null,
  router: { visit: vi.fn() },
  Link: ({ href, className, children }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

vi.mock('../../../../../../inertia/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, role: 'employee' },
  }),
}))

vi.mock('../../../../../../inertia/hooks/use_candidate_exercises', () => ({
  useCandidateExercises: () => ({
    isAnalyzing: false,
    isSavingDraft: false,
    saveResult: vi.fn(),
    saveDraft: vi.fn(),
  }),
}))

vi.mock('../../../../../../inertia/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}))

vi.mock('../../../../../../inertia/components/ui/AppLink', () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

vi.mock('../../../../../../inertia/components/ui/Button', () => ({
  default: ({ children, ...rest }: any) => <button {...rest}>{children}</button>,
}))

vi.mock('../../../../../../inertia/components/exercises/MotivationTool', () => ({
  default: () => <div data-testid="tool-motivation" />,
}))
vi.mock('../../../../../../inertia/components/exercises/ValuesTool', () => ({
  default: () => <div data-testid="tool-values" />,
}))
vi.mock('../../../../../../inertia/components/exercises/PersonalityTool', () => ({
  default: () => <div data-testid="tool-personality" />,
}))
vi.mock('../../../../../../inertia/components/exercises/LifeCurveTool', () => ({
  default: (props: any) => {
    lifeCurveToolSpy(props)
    return <div data-testid="tool-life-curve" />
  },
}))
vi.mock('../../../../../../inertia/components/exercises/TargetingTool', () => ({
  default: () => <div data-testid="tool-targeting" />,
}))
vi.mock('../../../../../../inertia/components/exercises/DISCTool', () => ({
  default: () => <div data-testid="tool-disc" />,
}))
vi.mock('../../../../../../inertia/components/exercises/SkillMappingTool', () => ({
  default: () => <div data-testid="tool-skill-mapping" />,
}))
vi.mock('../../../../../../inertia/components/exercises/CircleOfControlTool', () => ({
  default: () => <div data-testid="tool-circle-of-control" />,
}))

const minimalEmployee = (): Employee =>
  ({
    id: 99,
    organizationId: 1,
    name: 'Test',
    email: 't@test.com',
    currentRole: 'Dev',
    skills: [],
    experiences: [],
    educations: [],
    status: 'active',
    onboarded: true,
    exercises: [],
    plan: [],
  }) as Employee

describe('Dashboard candidat - Exercise Home', () => {
  beforeEach(() => {
    useEmployeeSpy.mockImplementation((_id, initial) => ({
      employee: initial ?? null,
      refreshEmployee: vi.fn(),
    }))
  })

  test('passes Inertia employee to useEmployee so saveResult can run', () => {
    const employee = minimalEmployee()
    render(
      <ExerciseHome type="life_curve" employee={employee} initialDraftsByType={{}} accessGranted />
    )

    expect(useEmployeeSpy).toHaveBeenCalledWith(expect.anything(), employee)
  })

  test('shows inline message and does not render tools when accessGranted=false', () => {
    render(
      <ExerciseHome
        type="motivation"
        initialDraftsByType={{}}
        accessGranted={false}
        blockedMessage="Verrouillé par l'expert"
      />
    )

    expect(screen.getByText('Accès verrouillé')).toBeInTheDocument()
    expect(screen.getByText('Verrouillé par l\'expert')).toBeInTheDocument()

    expect(screen.queryByTestId('tool-motivation')).not.toBeInTheDocument()
  })

  test('passes completed result fallback as initial draft for candidate tool hydration', async () => {
    const employee = minimalEmployee()
    const completedPayload = {
      employeeId: 99,
      type: 'life_curve',
      lastUpdated: '2026-03-01T10:00:00.000Z',
      data: {
        points: [{ year: 2024, satisfaction: 8, label: 'Test' }],
        reflection: { form: 'up', mostlySatisfied: 'yes' },
        step: 2,
      },
    }

    render(
      <ExerciseHome
        type="life_curve"
        employee={employee}
        initialDraftsByType={{ life_curve: completedPayload as any }}
        accessGranted
      />
    )

    const lastCall = lifeCurveToolSpy.mock.calls.at(-1)
    expect(lastCall).toBeDefined()

    const props = lastCall?.[0]
    const resolvedInitial = await props.initialDraftPromise
    expect(resolvedInitial).toEqual(completedPayload)
  })

  test('shows exercise progress percentage in header', () => {
    const employee = minimalEmployee()
    const { getByText } = render(
      <ExerciseHome
        type="motivation"
        employee={employee}
        initialDraftsByType={{}}
        accessGranted
        exerciseProgressPercent={62}
      />
    )

    expect(getByText(/Progression: 62%/i)).toBeInTheDocument()
  })
})

