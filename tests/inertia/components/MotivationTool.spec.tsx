import { describe, test, expect, vi } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import MotivationTool from '../../../inertia/components/exercises/MotivationTool'

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
})
