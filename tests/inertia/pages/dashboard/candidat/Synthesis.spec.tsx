import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Synthesis from '../../../../../inertia/pages/dashboard/candidat/Synthesis'

vi.mock('@inertiajs/react', async (importOriginal) => {
  const actual = (await importOriginal()) as object
  return {
    ...actual,
    Head: () => null,
  }
})

vi.mock('../../../../../inertia/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}))

describe('Dashboard candidat Synthesis page', () => {
  test('shows not shared message when shared=false', () => {
    render(
      <Synthesis
        shared={false as const}
        employeeId="1"
        employee={null}
        synthesis={null}
        latestCompletedByType={{}}
      />
    )
    expect(screen.getByTestId('layout')).toBeInTheDocument()
    expect(screen.getByText(/n’est pas encore partagée/i)).toBeInTheDocument()
  })

  test('renders shared comments when shared=true', () => {
    render(
      <Synthesis
        shared={true as const}
        employeeId="1"
        employee={{
          id: 1,
          organizationId: 1,
          name: 'Jean',
          email: 'jean@example.com',
          currentRole: 'Lead',
          skills: [],
          experiences: [],
          educations: [],
          status: 'active' as any,
          onboarded: true,
          exercises: [],
          plan: [],
        }}
        synthesis={{
          shareStatus: 'shared',
          sharedAt: null,
          expertCommentsShared: 'Bonjour',
          executiveSummaryOverride: null,
        }}
        latestCompletedByType={{}}
      />
    )
    expect(screen.getByText('Bonjour')).toBeInTheDocument()
  })
})

