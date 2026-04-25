import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import EmployeeProfile from '../../../../inertia/pages/dashboard/EmployeeProfile'

vi.mock('../../../../inertia/hooks/use_auth', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Conseiller', role: 'advisor' as const },
  }),
}))

vi.mock('@inertiajs/react', async (importOriginal) => {
  const actual = (await importOriginal()) as object
  return {
    ...actual,
    Head: () => null,
    router: { visit: vi.fn() },
    usePage: () => ({ url: '/dashboard/conseiller/employees/1/profile', props: {} }),
  }
})

const mockEmployee = {
  id: 1,
  organizationId: 10,
  name: 'Marie Martin',
  email: 'marie@example.com',
  currentRole: 'Développeuse',
  targetRole: 'Lead Tech',
  summary: 'Parcours technique avec envie de prendre des responsabilités.',
  advisorNotes: undefined,
  status: 'active' as const,
  onboarded: true,
  experiences: [
    {
      id: 1,
      title: 'Développeuse fullstack',
      company: 'Tech Co',
      type: 'CDI' as const,
      startDate: '2020-01-01',
      endDate: '2024-06-01',
      isCurrent: false,
      description: 'Front et back React/Node.',
    },
  ],
  educations: [
    {
      id: 1,
      degree: 'Master Informatique',
      school: 'Université Paris',
      startDate: '2016-09-01',
      endDate: '2018-06-01',
      isCurrent: false,
      description: '',
    },
  ],
  skills: [
    { name: 'React', level: 4 },
    { name: 'TypeScript', level: 3 },
  ],
  exercises: [],
  plan: [],
}

vi.mock('../../../../inertia/hooks/useEmployee', () => ({
  useEmployee: (_id: string, initial: typeof mockEmployee) => ({
    employee: initial,
  }),
}))

describe('EmployeeProfile page', () => {
  test('renders candidate name and back link', () => {
    render(<EmployeeProfile employeeId="1" employee={mockEmployee} />)

    expect(screen.getByText('Marie Martin')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Retour à la fiche candidat/i })).toHaveAttribute(
      'href',
      '/dashboard/conseiller/employees/1'
    )
  })

  test('renders Profil section with email and current role', () => {
    render(<EmployeeProfile employeeId="1" employee={mockEmployee} />)

    expect(screen.getByText('Profil')).toBeInTheDocument()
    expect(screen.getByText('marie@example.com')).toBeInTheDocument()
    expect(screen.getByText('Lead Tech')).toBeInTheDocument()
    expect(screen.getAllByText('Développeuse').length).toBeGreaterThanOrEqual(1)
  })

  test('renders Bref / Résumé when summary is set', () => {
    render(<EmployeeProfile employeeId="1" employee={mockEmployee} />)

    expect(screen.getByText('Bref / Résumé')).toBeInTheDocument()
    expect(
      screen.getByText(/Parcours technique avec envie de prendre des responsabilités/)
    ).toBeInTheDocument()
  })

  test('renders Expériences section with experience data', () => {
    render(<EmployeeProfile employeeId="1" employee={mockEmployee} />)

    expect(screen.getByText('Expériences')).toBeInTheDocument()
    expect(screen.getByText('Développeuse fullstack')).toBeInTheDocument()
    expect(screen.getByText('Tech Co')).toBeInTheDocument()
    expect(screen.getByText(/Front et back React\/Node/)).toBeInTheDocument()
  })

  test('renders Formations section with education data', () => {
    render(<EmployeeProfile employeeId="1" employee={mockEmployee} />)

    expect(screen.getByText('Formations')).toBeInTheDocument()
    expect(screen.getByText('Master Informatique')).toBeInTheDocument()
    expect(screen.getByText('Université Paris')).toBeInTheDocument()
  })

  test('renders Compétences section with skills', () => {
    render(<EmployeeProfile employeeId="1" employee={mockEmployee} />)

    expect(screen.getByText('Compétences')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
  })

  test('does not render Bref section when summary is empty', () => {
    const noSummary = { ...mockEmployee, summary: undefined }
    render(<EmployeeProfile employeeId="1" employee={noSummary} />)

    expect(screen.queryByText('Bref / Résumé')).not.toBeInTheDocument()
  })

  test('shows empty state for experiences when none', () => {
    const noExperiences = { ...mockEmployee, experiences: [] }
    render(<EmployeeProfile employeeId="1" employee={noExperiences} />)

    expect(screen.getByText('Expériences')).toBeInTheDocument()
    expect(screen.getByText('Aucune expérience renseignée.')).toBeInTheDocument()
  })
})
