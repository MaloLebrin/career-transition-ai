import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EmployeeSynthesisPage from '../../../../../../inertia/pages/dashboard/conseiller/employees/Synthesis'

// ─── mocks ────────────────────────────────────────────────────────────────────

vi.mock('@inertiajs/react', async (importOriginal) => {
  const actual = (await importOriginal()) as object
  return {
    ...actual,
    Head: () => null,
    router: { post: vi.fn(), put: vi.fn() },
  }
})

vi.mock('../../../../../../inertia/hooks/use_auth', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Advisor', role: 'advisor' as const },
    logout: vi.fn(),
  }),
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

vi.mock('../../../../../../inertia/components/ui/AppLink', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

// ─── fixture ──────────────────────────────────────────────────────────────────

const baseEmployee = {
  id: 10,
  organizationId: 1,
  name: 'Marie Martin',
  email: 'marie@example.com',
  currentRole: 'Ingénieure',
  skills: [],
  experiences: [],
  educations: [],
  status: 'active' as const,
  onboarded: true,
  exercises: [],
  plan: [],
}

function makeSynthesis(shareStatus: 'draft' | 'shared') {
  return {
    shareStatus,
    sharedAt: null,
    expertCommentsShared: 'Bons résultats.',
    expertNotesInternal: 'Notes internes.',
    executiveSummaryOverride: null,
  }
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('EmployeeSynthesisPage — bouton PDF quand latestPdfJob est null', () => {
  beforeEach(async () => {
    const { router } = await import('@inertiajs/react')
    vi.mocked(router.post).mockClear()
    vi.mocked(router.put).mockClear()
  })

  test('bouton "Générer PDF (async)" visible quand synthèse partagée', () => {
    render(
      <EmployeeSynthesisPage
        employeeId="10"
        employee={baseEmployee}
        synthesis={makeSynthesis('shared')}
        latestCompletedByType={{}}
        latestPdfJob={null}
      />
    )

    const btn = screen.getByRole('button', { name: /Générer PDF \(async\)/i })
    expect(btn).toBeInTheDocument()
    expect(btn).not.toBeDisabled()
  })

  test('bouton "Générer PDF (async)" disabled quand synthèse en draft', () => {
    render(
      <EmployeeSynthesisPage
        employeeId="10"
        employee={baseEmployee}
        synthesis={makeSynthesis('draft')}
        latestCompletedByType={{}}
        latestPdfJob={null}
      />
    )

    const btn = screen.getByRole('button', { name: /Générer PDF \(async\)/i })
    expect(btn).toBeInTheDocument()
    // disabled car !isShared
    expect(btn).toBeDisabled()
  })

  test('clic sur "Générer" appelle router.post avec la bonne URL', async () => {
    const { router } = await import('@inertiajs/react')
    render(
      <EmployeeSynthesisPage
        employeeId="10"
        employee={baseEmployee}
        synthesis={makeSynthesis('shared')}
        latestCompletedByType={{}}
        latestPdfJob={null}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Générer PDF \(async\)/i }))

    expect(router.post).toHaveBeenCalledOnce()
    expect(router.post).toHaveBeenCalledWith(
      '/dashboard/conseiller/employees/10/synthesis/pdf',
      {},
      expect.objectContaining({ preserveScroll: true })
    )
  })
})

describe('EmployeeSynthesisPage — bouton PDF quand downloadUrl disponible', () => {
  beforeEach(async () => {
    const { router } = await import('@inertiajs/react')
    vi.mocked(router.post).mockClear()
  })

  test('affiche le lien "Télécharger PDF" quand downloadUrl est défini', () => {
    render(
      <EmployeeSynthesisPage
        employeeId="10"
        employee={baseEmployee}
        synthesis={makeSynthesis('shared')}
        latestCompletedByType={{}}
        latestPdfJob={{
          id: 99,
          status: 'completed',
          downloadUrl: '/dashboard/pdf-exports/99/download',
        }}
      />
    )

    const link = screen.getByRole('link', { name: /Télécharger PDF/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/dashboard/pdf-exports/99/download')

    // Le bouton "Générer" ne doit pas être affiché
    expect(screen.queryByRole('button', { name: /Générer PDF/i })).not.toBeInTheDocument()
  })

  test('affiche le bouton "Générer" si downloadUrl est null même avec latestPdfJob', () => {
    render(
      <EmployeeSynthesisPage
        employeeId="10"
        employee={baseEmployee}
        synthesis={makeSynthesis('shared')}
        latestCompletedByType={{}}
        latestPdfJob={{ id: 88, status: 'processing', downloadUrl: null }}
      />
    )

    expect(screen.getByRole('button', { name: /Générer PDF \(async\)/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Télécharger PDF/i })).not.toBeInTheDocument()
  })
})

describe('EmployeeSynthesisPage — informations de base', () => {
  test("affiche le nom de l'employé", () => {
    render(
      <EmployeeSynthesisPage
        employeeId="10"
        employee={baseEmployee}
        synthesis={makeSynthesis('shared')}
        latestCompletedByType={{}}
        latestPdfJob={null}
      />
    )

    expect(screen.getByText('Marie Martin')).toBeInTheDocument()
  })

  test('passe selectedEmployeeId au DashboardLayout', () => {
    render(
      <EmployeeSynthesisPage
        employeeId="10"
        employee={baseEmployee}
        synthesis={makeSynthesis('shared')}
        latestCompletedByType={{}}
        latestPdfJob={null}
      />
    )

    expect(screen.getByTestId('layout')).toHaveAttribute('data-selected-employee-id', '10')
  })
})
