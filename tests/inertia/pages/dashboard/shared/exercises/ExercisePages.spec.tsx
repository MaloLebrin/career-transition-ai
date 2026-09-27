import { beforeEach, describe, expect, test, vi } from 'vitest'
import { act, screen } from '@testing-library/react'
import type { ComponentType } from 'react'
import type { ExerciseDraft } from '~/types'

import CircleOfControlExercise from '~/pages/dashboard/shared/exercises/CircleOfControl'
import DISCExercise from '~/pages/dashboard/shared/exercises/DISC'
import LifeCurveExercise from '~/pages/dashboard/shared/exercises/LifeCurve'
import MotivationExercise from '~/pages/dashboard/shared/exercises/Motivation'
import PersonalityExercise from '~/pages/dashboard/shared/exercises/Personality'
import SkillMappingExercise from '~/pages/dashboard/shared/exercises/SkillMapping'
import TargetingExercise from '~/pages/dashboard/shared/exercises/Targeting'
import ValuesExercise from '~/pages/dashboard/shared/exercises/Values'
import { resetInertiaMock, routerSpies, setPageProps } from '../../../../support/inertia_mock'
import { renderWithUser } from '../../../../support/render'

/**
 * Pages d'exercice partagées (candidat / conseiller) : on vérifie le câblage entre la page,
 * l'outil d'exercice et `useAdvisorExercises` (type d'exercice, score, brouillon initial,
 * lien retour, redirection après enregistrement). Les outils eux-mêmes sont testés à part.
 */

const hook = vi.hoisted(() => ({
  state: { isAnalyzing: false, isSavingDraft: false },
  saveResult: vi.fn(),
  saveDraft: vi.fn(),
  calls: [] as unknown[][],
}))

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../../support/inertia_mock')
  return inertiaMock()
})

vi.mock('~/hooks/use_advisor_exercises', () => ({
  useAdvisorExercises: (...args: unknown[]) => {
    hook.calls.push(args)
    return { ...hook.state, saveResult: hook.saveResult, saveDraft: hook.saveDraft }
  },
}))

vi.mock('~/components/dashboard/DashboardLayout', () => ({
  default: ({ children, selectedEmployeeId }: { children: React.ReactNode; selectedEmployeeId: string | null }) => (
    <div data-testid="layout" data-employee={selectedEmployeeId ?? ''}>
      {children}
    </div>
  ),
}))

type ReactModule = typeof import('react')

/** Outil factice : expose onSave / onSaveDraft et affiche le brouillon initial résolu. */
function stubTool(React: ReactModule, name: string) {
  return {
    default: (props: {
      onSave: (data: unknown, duration: number) => void
      onSaveDraft?: (data: unknown) => void
      initialDraftPromise?: Promise<{ data?: unknown } | null>
      employeeProfile?: unknown
    }) => {
      const [draft, setDraft] = React.useState<string>('…')
      React.useEffect(() => {
        props.initialDraftPromise?.then((d) => setDraft(JSON.stringify(d?.data ?? null)))
      }, [])
      return (
        <div data-testid="tool" data-tool={name}>
          <span data-testid="draft">{draft}</span>
          <button type="button" onClick={() => props.onSave({ from: name }, 42)}>
            stub-save
          </button>
          {props.onSaveDraft && (
            <button type="button" onClick={() => props.onSaveDraft!({ partial: name })}>
              stub-draft
            </button>
          )}
        </div>
      )
    },
  }
}

vi.mock('~/components/exercises/CircleOfControlTool', async () => stubTool(await import('react'), 'CircleOfControlTool'))
vi.mock('~/components/exercises/DISCTool', async () => stubTool(await import('react'), 'DISCTool'))
vi.mock('~/components/exercises/LifeCurveTool', async () => stubTool(await import('react'), 'LifeCurveTool'))
vi.mock('~/components/exercises/MotivationTool', async () => stubTool(await import('react'), 'MotivationTool'))
vi.mock('~/components/exercises/PersonalityTool', async () => stubTool(await import('react'), 'PersonalityTool'))
vi.mock('~/components/exercises/SkillMappingTool', async () => stubTool(await import('react'), 'SkillMappingTool'))
vi.mock('~/components/exercises/TargetingTool', async () => stubTool(await import('react'), 'TargetingTool'))
vi.mock('~/components/exercises/ValuesTool', async () => stubTool(await import('react'), 'ValuesTool'))

/** Monte la page puis laisse l'outil factice résoudre son brouillon initial (asynchrone). */
async function renderPage(ui: React.ReactElement) {
  const utils = renderWithUser(ui)
  await act(async () => {})
  return utils
}

type PageCase = {
  name: string
  Page: ComponentType<{ employeeId?: string; initialDraftsByType?: Record<string, ExerciseDraft | null> }>
  tool: string
  type: string
  hasDraft: boolean
  requiresUser: boolean
}

const pages: PageCase[] = [
  { name: 'CircleOfControl', Page: CircleOfControlExercise, tool: 'CircleOfControlTool', type: 'circle_of_control', hasDraft: true, requiresUser: false },
  { name: 'DISC', Page: DISCExercise, tool: 'DISCTool', type: 'disc', hasDraft: true, requiresUser: false },
  { name: 'LifeCurve', Page: LifeCurveExercise, tool: 'LifeCurveTool', type: 'life_curve', hasDraft: true, requiresUser: true },
  { name: 'Motivation', Page: MotivationExercise, tool: 'MotivationTool', type: 'motivation', hasDraft: true, requiresUser: true },
  { name: 'Personality', Page: PersonalityExercise, tool: 'PersonalityTool', type: 'personality', hasDraft: false, requiresUser: true },
  { name: 'SkillMapping', Page: SkillMappingExercise, tool: 'SkillMappingTool', type: 'skill_mapping', hasDraft: true, requiresUser: false },
  { name: 'Targeting', Page: TargetingExercise, tool: 'TargetingTool', type: 'targeting', hasDraft: false, requiresUser: true },
  { name: 'Values', Page: ValuesExercise, tool: 'ValuesTool', type: 'values', hasDraft: true, requiresUser: false },
]

describe.each(pages)('page d’exercice $name', ({ Page, tool, type, hasDraft, requiresUser }) => {
  beforeEach(() => {
    resetInertiaMock()
    setPageProps({ user: { id: 99, email: 'a@b.c', role: 'advisor' } })
    hook.state.isAnalyzing = false
    hook.state.isSavingDraft = false
    hook.saveResult.mockReset()
    hook.saveDraft.mockReset()
    hook.calls.length = 0
  })

  test('côté conseiller : lien retour vers la fiche accompagné et outil affiché', async () => {
    await renderPage(<Page employeeId="5" initialDraftsByType={{}} />)
    expect(screen.getByTestId('tool')).toHaveAttribute('data-tool', tool)
    expect(screen.getByTestId('layout')).toHaveAttribute('data-employee', '5')
    expect(screen.getByRole('link', { name: /Retour/ })).toHaveAttribute('href', '/dashboard/conseiller/employees/5')
    expect(hook.calls.at(-1)![2]).toMatchObject({
      exercisesBasePath: '/dashboard/conseiller/employees/5/exercises',
    })
  })

  test('côté candidat : chemins /dashboard/candidat', async () => {
    await renderPage(<Page />)
    expect(screen.getByRole('link', { name: /Retour/ })).toHaveAttribute('href', '/dashboard/candidat')
    expect(hook.calls.at(-1)![2]).toMatchObject({ exercisesBasePath: '/dashboard/candidat/exercises' })
  })

  test('enregistrer le résultat transmet le type, les données, le score 10 et la durée', async () => {
    const { user } = await renderPage(<Page employeeId="5" />)
    await user.click(screen.getByRole('button', { name: 'stub-save' }))
    expect(hook.saveResult).toHaveBeenCalledWith(type, { from: tool }, 10, 42)
  })

  test('après enregistrement, redirige vers le lien retour', async () => {
    await renderPage(<Page employeeId="5" />)
    const onComplete = hook.calls.at(-1)![1] as () => Promise<void>
    await onComplete()
    expect(routerSpies.visit).toHaveBeenCalledWith('/dashboard/conseiller/employees/5')
  })

  test('indicateurs d’analyse IA et de sauvegarde automatique', async () => {
    hook.state.isAnalyzing = true
    hook.state.isSavingDraft = true
    await renderPage(<Page employeeId="5" />)
    expect(screen.getByText(/IA en action/)).toBeInTheDocument()
    if (hasDraft) expect(screen.getByText('Sauvegarde auto...')).toBeInTheDocument()
  })

  if (hasDraft) {
    test('brouillon : l’outil reçoit le brouillon du type et sauvegarde les brouillons', async () => {
      const draft = { employeeId: '5', type, lastUpdated: '2024-01-01', data: { step: 2 } } as ExerciseDraft
      const { user } = await renderPage(
        <Page employeeId="5" initialDraftsByType={{ [type]: draft, autre: { ...draft, data: 'x' } }} />
      )
      expect(await screen.findByText('{"step":2}')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'stub-draft' }))
      expect(hook.saveDraft).toHaveBeenCalledWith(type, { partial: tool })
    })

    test('sans brouillon pour ce type : brouillon initial nul', async () => {
      await renderPage(<Page employeeId="5" />)
      expect(await screen.findByText('null')).toBeInTheDocument()
    })
  }

  if (requiresUser) {
    test('sans utilisateur connecté : chargement puis redirection vers la connexion', async () => {
      setPageProps({})
      await renderPage(<Page employeeId="5" />)
      expect(screen.queryByTestId('tool')).not.toBeInTheDocument()
      expect(routerSpies.visit).toHaveBeenCalledWith('/auth/login')
    })
  }
})
