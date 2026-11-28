import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'

import ExerciseHome from '../../../../../../inertia/pages/dashboard/employee/exercises/Home'
import type { Employee } from '../../../../../../inertia/types'
import { MOTIVATIONS } from '../../../../../../inertia/constants/motivations'
import { SCHWARTZ_VALUES } from '../../../../../../inertia/constants/values'
import { emptyMotivationMatrix } from '../../../../../../shared/helpers/exercise/motivation_resume'

/**
 * Non-régression : un candidat qui rouvre un exercice terminé reçoit le résultat
 * terminé comme point de départ (`ExerciseResultsService.findDraftOrCompletedForCandidate` :
 * données du résultat + `step: 2`). La page Motivations affichait « NaN% »,
 * « Duel NaN / 231 » et deux options vides. Ici, les vrais outils sont rendus (pas de
 * mock) avec exactement cette charge utile.
 */

vi.mock('../../../../../../inertia/hooks/use_employee', () => ({
  useEmployee: (_id: unknown, initial?: Employee | null) => ({
    employee: initial ?? null,
    refreshEmployee: vi.fn(),
  }),
}))

vi.mock('@inertiajs/react', () => ({
  Head: () => null,
  router: { visit: vi.fn() },
  Link: ({ href, children }: any) => <a href={href}>{children}</a>,
}))

vi.mock('../../../../../../inertia/hooks/use_billing', () => ({
  useBilling: () => ({ paymentsEnabled: false, resultsPriceCents: 4900, currency: 'eur' }),
}))

vi.mock('../../../../../../inertia/hooks/use_auth', () => ({
  useAuth: () => ({ user: { id: 1, role: 'employee' } }),
}))

const { saveDraft } = vi.hoisted(() => ({ saveDraft: vi.fn() }))
vi.mock('../../../../../../inertia/hooks/use_candidate_exercises', () => ({
  useCandidateExercises: () => ({
    isAnalyzing: false,
    isSavingDraft: false,
    saveResult: vi.fn(),
    saveDraft,
  }),
}))

vi.mock('../../../../../../inertia/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}))

const employee = {
  id: 99,
  organizationId: 1,
  name: 'Test',
  email: 't@test.com',
  skills: [],
  experiences: [],
  educations: [],
  status: 'active',
  onboarded: true,
  exercises: [],
  plan: [],
} as unknown as Employee

/** Charge utile renvoyée par le serveur pour un exercice terminé. */
function completedDraft(type: string, data: Record<string, unknown>) {
  return {
    employeeId: 99,
    type,
    lastUpdated: '2026-11-28T10:00:00.000Z',
    data: { ...data, step: 2 },
  }
}

async function renderPage(type: string, draft: unknown) {
  render(
    <ExerciseHome
      type={type}
      employee={employee}
      initialDraftsByType={{ [type]: draft } as any}
      accessGranted
      exerciseProgressPercent={100}
    />
  )
  // Laisse les outils lire leur `initialDraftPromise`.
  await act(async () => {
    await Promise.resolve()
  })
}

describe('Candidat : rouvrir un exercice terminé', () => {
  let consoleError: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    saveDraft.mockClear()
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    // Aucun rendu en erreur (ex. `MOTIVATIONS[undefined].label`).
    expect(consoleError).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })

  test('Motivations : écran d’accueil, aucun « NaN », puis nouveau passage au premier duel', async () => {
    const matrix = emptyMotivationMatrix().map((row, i) => row.map((_, j) => (j > i ? i : null)))
    await renderPage(
      'motivation',
      completedDraft('motivation', {
        ranked: MOTIVATIONS.map((m) => m.label),
        scores: {},
        matrix,
      })
    )

    expect(document.body.textContent).not.toMatch(/NaN/)
    fireEvent.click(screen.getByRole('button', { name: /Commencer l'analyse/i }))

    expect(document.body.textContent).not.toMatch(/NaN/)
    expect(screen.getByText(/Duel 1 \/ 231/)).toBeInTheDocument()
    expect(screen.getByText(MOTIVATIONS[0].label)).toBeInTheDocument()
    expect(screen.getByText(MOTIVATIONS[0].definition)).toBeInTheDocument()
    expect(screen.getByText(MOTIVATIONS[1].label)).toBeInTheDocument()
  })

  test('Motivations : brouillon sans position enregistrée, reprise sans « NaN »', async () => {
    const matrix = emptyMotivationMatrix()
    matrix[0][1] = 0
    await renderPage('motivation', {
      ...completedDraft('motivation', { matrix }),
      data: { matrix },
    })

    expect(document.body.textContent).not.toMatch(/NaN/)
    expect(screen.getByText(/Duel 2 \/ 231/)).toBeInTheDocument()
  })

  test('Valeurs : reprise à l’étape 2 avec le classement enregistré', async () => {
    await renderPage(
      'values',
      completedDraft('values', {
        selectedValues: SCHWARTZ_VALUES.map((v) => v.label),
        peopleExercise: [
          { name: 'A', values: 'x' },
          { name: 'B', values: 'y' },
          { name: 'C', values: 'z' },
        ],
      })
    )

    expect(document.body.textContent).not.toMatch(/NaN|undefined/)
    expect(screen.getByDisplayValue('A')).toBeInTheDocument()
  })
})
