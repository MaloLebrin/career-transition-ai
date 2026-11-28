import { describe, test, expect, vi } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import MotivationTool from '../../../inertia/components/exercises/MotivationTool'
import { MOTIVATIONS } from '../../../inertia/constants/motivations'
import { emptyMotivationMatrix } from '../../../shared/helpers/exercise/motivation_resume'

describe('MotivationTool', () => {
  test('renders intro screen and starts exercise', async () => {
    const onSave = vi.fn()
    const onSaveDraft = vi.fn()

    render(<MotivationTool onSave={onSave} onSaveDraft={onSaveDraft} />)

    expect(screen.getByText('Matrice des Motivations')).toBeInTheDocument()
    expect(screen.getByText(/Comparez les 22 leviers d'engagement un par un/i)).toBeInTheDocument()

    const startButton = screen.getByRole('button', { name: /Commencer l'analyse/i })

    await act(async () => {
      startButton.click()
    })

    // Après démarrage, on doit voir la question principale
    await waitFor(() => {
      expect(screen.getByText(/Lequel est le plus important pour vous/i)).toBeInTheDocument()
    })

    // Chaque option du duel montre sa définition au moment du choix
    expect(screen.getByText(MOTIVATIONS[0].definition)).toBeInTheDocument()
    expect(screen.getByText(MOTIVATIONS[1].definition)).toBeInTheDocument()
  })

  test('records a decision and saves draft when started', async () => {
    const onSave = vi.fn()
    const onSaveDraft = vi.fn()

    render(<MotivationTool onSave={onSave} onSaveDraft={onSaveDraft} />)

    // Démarrer l'exercice
    const startButton = screen.getByRole('button', { name: /Commencer l'analyse/i })
    await act(async () => {
      startButton.click()
    })

    // Cliquer sur la première option disponible
    const duelButtons = screen.getAllByRole('button')
    const firstOption = duelButtons[0]

    await act(async () => {
      firstOption.click()
    })

    expect(onSaveDraft).toHaveBeenCalled()
    expect(onSave).not.toHaveBeenCalled()
  })

  // Non-régression : un exercice terminé était repris comme un brouillon, d'où
  // « NaN% », « Duel NaN / 231 » et des options vides (puis un plantage).
  test('exercice terminé : écran d’accueil, puis un nouveau passage depuis le premier duel', async () => {
    const matrix = emptyMotivationMatrix().map((row, i) => row.map((_, j) => (j > i ? i : null)))
    const completed = Promise.resolve({
      data: { ranked: MOTIVATIONS.map((m) => m.label), scores: {}, matrix, step: 2 },
    } as any)

    render(
      <MotivationTool onSave={vi.fn()} onSaveDraft={vi.fn()} initialDraftPromise={completed} />
    )
    await act(async () => {
      await completed
    })

    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument()
    const start = screen.getByRole('button', { name: /Commencer l'analyse/i })
    await act(async () => {
      start.click()
    })
    expect(screen.getByText('0%')).toBeInTheDocument()
    expect(screen.getByText(MOTIVATIONS[0].label)).toBeInTheDocument()
    expect(screen.getByText(MOTIVATIONS[1].label)).toBeInTheDocument()
  })

  test('brouillon sans position enregistrée : reprise au premier duel non joué', async () => {
    const matrix = emptyMotivationMatrix()
    matrix[0][1] = 0
    const draft = Promise.resolve({ data: { matrix } } as any)

    render(<MotivationTool onSave={vi.fn()} onSaveDraft={vi.fn()} initialDraftPromise={draft} />)
    await act(async () => {
      await draft
    })

    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument()
    expect(screen.getByText(MOTIVATIONS[0].label)).toBeInTheDocument()
    expect(screen.getByText(MOTIVATIONS[2].label)).toBeInTheDocument()
  })
})
