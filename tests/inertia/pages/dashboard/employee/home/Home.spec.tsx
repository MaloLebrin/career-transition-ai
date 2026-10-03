import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import CandidatHome from '../../../../../../inertia/pages/dashboard/employee/home/Home'

const { employeeHomeSpy, b2cHomeSpy, authState } = vi.hoisted(() => ({
  employeeHomeSpy: vi.fn(),
  b2cHomeSpy: vi.fn(),
  authState: { user: { id: 2, role: 'employee', accountType: 'b2b' } as Record<string, unknown> },
}))

vi.mock('@inertiajs/react', () => ({
  Head: () => null,
}))

vi.mock('../../../../../../inertia/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}))

vi.mock('../../../../../../inertia/components/dashboard/EmailVerificationBanner', () => ({
  EmailVerificationBanner: () => <div data-testid="email-verification-banner" />,
}))

vi.mock('../../../../../../inertia/hooks/use_auth', () => ({
  useAuth: () => ({ user: authState.user }),
}))

vi.mock('../../../../../../inertia/components/dashboard/b2c/B2cEmployeeHome', () => ({
  B2cEmployeeHome: (props: any) => {
    b2cHomeSpy(props)
    return <div data-testid="b2c-employee-home" />
  },
}))

vi.mock('../../../../../../inertia/components/dashboard/EmployeeHome', () => ({
  default: (props: any) => {
    employeeHomeSpy(props)
    return <div data-testid="employee-home" />
  },
}))

const b2cAccess = {
  accountType: 'b2c' as const,
  unlockedExerciseSlugs: ['motivation' as const, 'values' as const],
  lockedReason: 'payment' as const,
  hasPaidAccess: false,
  freeExerciseTypes: ['motivation' as const, 'values' as const],
  paymentsEnabled: false,
}

describe('Dashboard candidat - Home', () => {
  beforeEach(() => {
    employeeHomeSpy.mockClear()
    b2cHomeSpy.mockClear()
    authState.user = { id: 2, role: 'employee', accountType: 'b2b' }
  })

  test('passes completion props to EmployeeHome', () => {
    const employee = {
      id: 1,
      organizationId: 1,
      userId: 2,
      name: 'Hubert Duboc',
      email: 'hubert@example.com',
      currentRole: 'Dev',
      targetRole: 'Lead',
      summary: null,
      advisorNotes: null,
      status: 'active',
      onboarded: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      skills: [],
      exercises: [],
      plan: [],
      experiences: [],
      educations: [],
    }

    render(
      <CandidatHome
        employee={employee}
        completedExercises={2}
        totalExercises={8}
        exerciseCompletionPercent={25}
        exerciseProgressByType={{ motivation: 40, values: 100 }}
      />
    )

    // Bandeau de vérification d'e-mail (#98) monté au-dessus de l'accueil.
    expect(screen.getByTestId('email-verification-banner')).toBeInTheDocument()
    expect(employeeHomeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        employee,
        completedExercises: 2,
        totalExercises: 8,
        exerciseCompletionPercent: 25,
        exerciseProgressByType: { motivation: 40, values: 100 },
      })
    )
    expect(b2cHomeSpy).not.toHaveBeenCalled()
    expect(screen.queryByTestId('b2c-employee-home')).not.toBeInTheDocument()
  })

  test('un particulier B2C voit son accueil dédié (#100)', () => {
    authState.user = { id: 2, role: 'employee', accountType: 'b2c' }
    const employee = { id: 1, name: 'Camille Martin', skills: [], exercises: [], plan: [] } as any

    render(
      <CandidatHome
        employee={employee}
        completedExercises={1}
        totalExercises={8}
        exerciseCompletionPercent={12}
        exerciseProgressByType={{ motivation: 100 }}
        advisor={{ name: 'Nadia Experte' }}
        exerciseAccess={b2cAccess}
      />
    )

    expect(screen.getByTestId('b2c-employee-home')).toBeInTheDocument()
    expect(employeeHomeSpy).not.toHaveBeenCalled()
    expect(b2cHomeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        employee,
        advisor: { name: 'Nadia Experte' },
        exerciseAccess: b2cAccess,
        completedExercises: 1,
      })
    )
  })

  test('sans prop exerciseAccess, un B2C retombe sur l’accueil classique', () => {
    authState.user = { id: 2, role: 'employee', accountType: 'b2c' }
    const employee = { id: 1, name: 'Camille Martin', skills: [], exercises: [], plan: [] } as any

    render(
      <CandidatHome
        employee={employee}
        completedExercises={0}
        totalExercises={8}
        exerciseCompletionPercent={0}
        exerciseProgressByType={{}}
      />
    )

    expect(screen.getByTestId('employee-home')).toBeInTheDocument()
  })
})
