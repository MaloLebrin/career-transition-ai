import { describe, test, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, fireEvent } from '@testing-library/react'
import Synthesis from '../../../../../inertia/pages/dashboard/candidat/Synthesis'

const transmitMock = vi.hoisted(() => ({
  channels: [] as string[],
  handler: null as null | ((data: unknown) => void),
}))

// ─── mocks ────────────────────────────────────────────────────────────────────

vi.mock('@inertiajs/react', async (importOriginal) => {
  const actual = (await importOriginal()) as object
  return {
    ...actual,
    Head: () => null,
    router: { post: vi.fn() },
  }
})

vi.mock('../../../../../inertia/hooks/use_auth', () => ({
  useAuth: () => ({ user: { id: 5, role: 'employee', name: 'Jean Dupont' } }),
}))

vi.mock('@adonisjs/transmit-client', () => ({
  Transmit: vi.fn().mockImplementation(() => ({
    subscription: (channel: string) => {
      transmitMock.channels.push(channel)
      return {
        create: () => Promise.resolve(),
        delete: () => Promise.resolve(),
        onMessage: (handler: (data: unknown) => void) => {
          transmitMock.handler = handler
          return () => {}
        },
      }
    },
  })),
}))

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
  beforeEach(() => {
    transmitMock.channels = []
    transmitMock.handler = null
  })

  test('affiche "Générer le PDF" quand latestPdfJob est null', () => {
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

    expect(screen.getByRole('button', { name: /Générer le PDF/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Télécharger le PDF/i })).not.toBeInTheDocument()
  })

  test('affiche la génération en cours quand le dernier export est en attente', () => {
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

    expect(screen.getByRole('status')).toHaveTextContent(/Génération du PDF en cours/i)
    expect(screen.queryByRole('button', { name: /Générer/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Télécharger le PDF/i })).not.toBeInTheDocument()
  })

  test('propose de réessayer quand la génération a échoué', () => {
    render(
      <Synthesis
        shared={true}
        employeeId="1"
        employee={sharedEmployee}
        synthesis={sharedSynthesis}
        latestCompletedByType={{}}
        latestPdfJob={{ id: 7, status: 'failed', downloadUrl: null }}
      />
    )

    expect(screen.getByRole('alert')).toHaveTextContent(/a échoué/i)
    expect(screen.getByRole('button', { name: /Générer le PDF/i })).toBeInTheDocument()
  })

  test('affiche le lien dès que Transmit annonce le PDF prêt (#70)', async () => {
    render(
      <Synthesis
        shared={true}
        employeeId="1"
        employee={sharedEmployee}
        synthesis={sharedSynthesis}
        latestCompletedByType={{}}
        latestPdfJob={{ id: 9, status: 'processing', downloadUrl: null }}
      />
    )
    await act(async () => {})
    expect(transmitMock.channels).toEqual(['users/5/pdf-exports'])

    // Export d'un autre candidat : ignoré.
    act(() => transmitMock.handler?.({ id: 10, status: 'completed', employeeId: 2 }))
    expect(screen.queryByRole('link', { name: /Télécharger le PDF/i })).not.toBeInTheDocument()

    act(() => transmitMock.handler?.({ id: 9, status: 'completed', employeeId: 1 }))
    expect(screen.getByRole('link', { name: /Télécharger le PDF/i })).toHaveAttribute(
      'href',
      '/dashboard/pdf-exports/9/download'
    )
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

    fireEvent.click(screen.getByRole('button', { name: /Générer le PDF/i }))
    expect(router.post).toHaveBeenCalledOnce()
    expect(router.post).toHaveBeenCalledWith(
      '/dashboard/candidat/synthesis/pdf',
      {},
      { preserveScroll: true }
    )
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
