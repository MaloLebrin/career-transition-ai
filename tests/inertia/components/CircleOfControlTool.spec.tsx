import { describe, test, expect, vi } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import CircleOfControlTool from '../../../inertia/components/exercises/CircleOfControlTool'

describe('CircleOfControlTool', () => {
  const onSave = vi.fn()
  const onSaveDraft = vi.fn()

  test('renders intro and starts game', async () => {
    render(
      <CircleOfControlTool
        onSave={onSave}
        onSaveDraft={onSaveDraft}
      />
    )

    expect(screen.getByText(/Cercle de Contrôle/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Vous allez voir 20 situations/i)
    ).toBeInTheDocument()

    const startButton = screen.getByRole('button', { name: /Commencer le tri/i })
    await act(async () => {
      startButton.click()
    })

    await waitFor(() => {
      expect(
        screen.getByText(/Positionnez cet élément/i)
      ).toBeInTheDocument()
    })
  })
})

