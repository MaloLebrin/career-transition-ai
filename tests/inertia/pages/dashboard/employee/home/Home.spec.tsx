import { describe, expect, test, vi } from 'vitest'
import { render } from '@testing-library/react'

import CandidatHome from '../../../../../../inertia/pages/dashboard/employee/home/Home'

const { employeeHomeSpy } = vi.hoisted(() => ({ employeeHomeSpy: vi.fn() }))

vi.mock('@inertiajs/react', () => ({
  Head: () => null,
}))

vi.mock('../../../../../../inertia/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}))

vi.mock('../../../../../../inertia/components/dashboard/EmployeeHome', () => ({
  default: (props: any) => {
    employeeHomeSpy(props)
    return <div data-testid="employee-home" />
  },
}))

describe('Dashboard candidat - Home', () => {
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

    expect(employeeHomeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        employee,
        completedExercises: 2,
        totalExercises: 8,
        exerciseCompletionPercent: 25,
        exerciseProgressByType: { motivation: 40, values: 100 },
      })
    )
  })
})

