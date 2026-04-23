import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Synthesis from '../../../../../inertia/pages/dashboard/candidat/Synthesis'

// ─── mocks ────────────────────────────────────────────────────────────────────

vi.mock('@inertiajs/react', async (importOriginal) => {
  const actual = (await importOriginal()) as object
  return {
    ...actual,
    Head: () => null,
    router: { post: vi.fn() },
  }
})

vi.mock('../../../../../inertia/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}))

// ─── fixture ──────────────────────────────────────────────────────────────────

const sharedEmployee = {
  id: 1,
  organizationId: 1,
  name: 'Jean Dupont',
  email: 'jean@example.com',
  currentRole: 'Chef de projet',
  skills: [],
  experiences: [],
  educations: [],
  status: 'active' as const,
  onboarded: true,
  exercises: [],
  plan: [],
}

const sharedSynthesis = {
  shareStatus: 'shared' as const,
  sharedAt: null,
  expertCommentsShared: 'Vous faites du bon travail.',
  executiveSummaryOverride: null,
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('CandidateSynthesisPage — bouton PDF', () => {
  test('affiche "Générer le PDF (async)" quand latestPdfJob est null', () => {
    render(
      <Synthesis
        shared={true}
        employeeId="1"
        employee={sharedEmployee}
        synthesis={sharedSynthesis}
        latestCompletedByType={{}}
        latestPdfJob={null}
      />
    )

    expect(screen.getByRole('button', { name: /Générer le PDF \(async\)/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Télécharger le PDF/i })).not.toBeInTheDocument()
  })

  test("affiche \"Générer le PDF (async)\" quand latestPdfJob existe mais sans downloadUrl", () => {
    render(
      <Synthesis
        shared={true}
        employeeId="1"
        employee={sharedEmployee}
        synthesis={sharedSynthesis}
        latestCompletedByType={{}}
        latestPdfJob={{ id: 7, status: 'pending', downloadUrl: null }}
      />
    )

    expect(screen.getByRole('button', { name: /Générer le PDF \(async\)/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Télécharger le PDF/i })).not.toBeInTheDocument()
  })

  test('affiche le lien de téléchargement quand downloadUrl est défini', () => {
    render(
      <Synthesis
        shared={true}
        employeeId="1"
        employee={sharedEmployee}
        synthesis={sharedSynthesis}
        latestCompletedByType={{}}
        latestPdfJob={{
          id: 42,
          status: 'completed',
          downloadUrl: '/dashboard/pdf-exports/42/download',
        }}
      />
    )

    const link = screen.getByRole('link', { name: /Télécharger le PDF/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/dashboard/pdf-exports/42/download')
    expect(screen.queryByRole('button', { name: /Générer/i })).not.toBeInTheDocument()
  })

  test('clic sur "Générer" appelle router.post avec la bonne URL', async () => {
    const { router } = await import('@inertiajs/react')
    vi.mocked(router.post).mockClear()

    render(
      <Synthesis
        shared={true}
        employeeId="1"
        employee={sharedEmployee}
        synthesis={sharedSynthesis}
        latestCompletedByType={{}}
        latestPdfJob={null}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Générer le PDF \(async\)/i }))
    expect(router.post).toHaveBeenCalledOnce()
    expect(router.post).toHaveBeenCalledWith('/dashboard/candidat/synthesis/pdf')
  })
})

describe('CandidateSynthesisPage — synthèse non partagée', () => {
  test('affiche le message "pas encore partagée" sans bouton PDF', () => {
    render(
      <Synthesis
        shared={false}
        employeeId="1"
        employee={null}
        synthesis={null}
        latestCompletedByType={{}}
        latestPdfJob={null}
      />
    )

    expect(screen.getByText(/pas encore partagée/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Générer/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Télécharger/i })).not.toBeInTheDocument()
  })
})
