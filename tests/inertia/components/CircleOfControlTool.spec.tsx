import { describe, test, expect, vi } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import CircleOfControlTool from '../../../inertia/components/exercises/CircleOfControlTool'

describe('CircleOfControlTool', () => {
  const onSave = vi.fn()
  const onSaveDraft = vi.fn()

  test('renders intro and starts game', async () => {
    render(<CircleOfControlTool onSave={onSave} onSaveDraft={onSaveDraft} />)

    expect(screen.getByText(/Cercle de Contrôle/i)).toBeInTheDocument()
    expect(screen.getByText(/Vous allez voir 20 situations/i)).toBeInTheDocument()

    const startButton = screen.getByRole('button', { name: /Commencer le tri/i })
    await act(async () => {
      startButton.click()
    })

    await waitFor(() => {
      expect(screen.getByText(/Positionnez cet élément/i)).toBeInTheDocument()
    })
  })

  test('supports keyboard arrows during playing', async () => {
    render(
      <CircleOfControlTool
        onSave={onSave}
        onSaveDraft={onSaveDraft}
        initialDraftPromise={Promise.resolve({ data: { decisions: {}, currentIndex: 0, gameState: 'intro' } } as any)}
      />
    )

    // Ensure initial draft promise has been applied before interacting
    await act(async () => {})

    const startButton = screen.getByRole('button', { name: /Commencer le tri/i })
    await act(async () => {
      startButton.click()
    })

    await waitFor(() => {
      expect(screen.getByText(/Positionnez cet élément/i)).toBeInTheDocument()
    })

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    })

    await new Promise((r) => setTimeout(r, 400))

    await waitFor(() => {
      expect(screen.getByText(/Item 2 \/ 20/i)).toBeInTheDocument()
    })
  })
})
