import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import EmployeeProfile from '../../../inertia/pages/dashboard/employee/profile/Home'

vi.mock('@inertiajs/react', async (importOriginal) => {
  const actual = (await importOriginal()) as object
  return {
    ...actual,
    Head: () => null,
    usePage: () => ({ url: '/dashboard/candidat/profile', props: {} }),
  }
})

// Sections sans rapport avec les documents : remplacées pour isoler la page.
vi.mock('../../../inertia/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('../../../inertia/components/dashboard/NotesSection', () => ({ default: () => null }))
vi.mock('../../../inertia/components/dashboard/employee/profile/Skills', () => ({
  Skills: () => null,
}))
vi.mock('../../../inertia/components/dashboard/employee/profile/educations/EducationsCard', () => ({
  EducationsCard: () => null,
}))
vi.mock(
  '../../../inertia/components/dashboard/employee/profile/experiences/experience_card/ExperiencesCard',
  () => ({ ExperiencesCard: () => null })
)
vi.mock(
  '../../../inertia/components/dashboard/employee/profile/documents/CandidateDocuments',
  () => ({
    CandidateDocuments: ({ baseUrl, documents }: { baseUrl: string; documents: unknown[] }) => (
      <div data-testid="documents" data-base-url={baseUrl} data-count={documents.length} />
    ),
  })
)

const employee = {
  id: 3,
  name: 'Élodie Martin',
  email: 'elodie@example.com',
  currentRole: 'Comptable',
  targetRole: null,
  summary: null,
  status: 'active',
  experiences: [],
  educations: [],
  skills: [],
} as any

describe('Profil candidat (dashboard/employee/profile/Home)', () => {
  test('affiche la section Documents avec la base de routes fournie', () => {
    render(
      <EmployeeProfile
        employeeId="3"
        employee={employee}
        documents={[{ id: 1 } as any]}
        documentsBaseUrl="/dashboard/candidat/documents"
      />
    )

    const section = screen.getByTestId('documents')
    expect(section).toHaveAttribute('data-base-url', '/dashboard/candidat/documents')
    expect(section).toHaveAttribute('data-count', '1')
  })

  test('sans base de routes, pas de section Documents', () => {
    render(<EmployeeProfile employeeId="3" employee={employee} />)

    expect(screen.queryByTestId('documents')).not.toBeInTheDocument()
    expect(screen.getByText('Élodie Martin')).toBeInTheDocument()
  })
})
