import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import EmployeeProfile from '../../../inertia/pages/dashboard/employee/profile/Home'

const { pageProps } = vi.hoisted(() => ({ pageProps: { current: {} as Record<string, unknown> } }))

vi.mock('@inertiajs/react', async (importOriginal) => {
  const actual = (await importOriginal()) as object
  return {
    ...actual,
    Head: () => null,
    usePage: () => ({ url: '/dashboard/candidat/profile', props: pageProps.current }),
  }
})
vi.mock('../../../inertia/components/profile/PasswordForm', () => ({
  PasswordForm: () => <form aria-label="Changer mon mot de passe" />,
}))
vi.mock('../../../inertia/components/dashboard/employee/profile/identity/IdentityForm', () => ({
  IdentityForm: () => <form aria-label="Modifier mon identité" />,
}))
vi.mock('../../../inertia/components/dashboard/employee/profile/data_rights/DataRights', () => ({
  DataRights: ({ rights }: { rights: { erasureRequestedAt: string | null } }) => (
    <div data-testid="data-rights" data-requested={rights.erasureRequestedAt ?? ''} />
  ),
}))

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
  beforeEach(() => {
    pageProps.current = {}
  })

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

  /** #68 : le candidat change son mot de passe depuis son profil, pas le conseiller qui le consulte. */
  test('le candidat voit le formulaire de mot de passe', () => {
    pageProps.current = {
      user: { id: 9, role: 'employee', name: 'Élodie', email: 'e@example.com' },
    }
    render(<EmployeeProfile employeeId="3" employee={employee} />)

    expect(screen.getByRole('form', { name: 'Changer mon mot de passe' })).toBeInTheDocument()
  })

  test('le conseiller qui consulte la fiche ne le voit pas', () => {
    pageProps.current = { user: { id: 2, role: 'advisor', name: 'Paul', email: 'p@example.com' } }
    render(<EmployeeProfile employeeId="3" employee={employee} />)

    expect(screen.queryByRole('form', { name: 'Changer mon mot de passe' })).not.toBeInTheDocument()
  })

  /** #70 : identité modifiable et droits RGPD sur son propre profil. */
  test('le candidat voit son formulaire d’identité et ses droits sur ses données', () => {
    pageProps.current = {
      user: { id: 9, role: 'employee', name: 'Élodie', email: 'e@example.com' },
    }
    render(
      <EmployeeProfile
        employeeId="3"
        employee={employee}
        dataRights={{ erasureRequestedAt: '2026-09-01T10:00:00.000Z' }}
      />
    )

    expect(screen.getByRole('form', { name: 'Modifier mon identité' })).toBeInTheDocument()
    expect(screen.getByText('Mes données')).toBeInTheDocument()
    expect(screen.getByTestId('data-rights')).toHaveAttribute(
      'data-requested',
      '2026-09-01T10:00:00.000Z'
    )
  })

  test('le conseiller ne voit ni l’identité modifiable ni les droits du candidat', () => {
    pageProps.current = { user: { id: 2, role: 'advisor', name: 'Paul', email: 'p@example.com' } }
    render(
      <EmployeeProfile
        employeeId="3"
        employee={employee}
        dataRights={{ erasureRequestedAt: null }}
      />
    )

    expect(screen.queryByRole('form', { name: 'Modifier mon identité' })).not.toBeInTheDocument()
    expect(screen.queryByTestId('data-rights')).not.toBeInTheDocument()
  })
})
