import { afterEach, describe, test, expect, vi } from 'vitest'
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react'
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
        initialDraftPromise={Promise.resolve({
          data: { decisions: {}, currentIndex: 0, gameState: 'intro' },
        } as any)}
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

describe('CircleOfControlTool — tri complet', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  function decide(label: RegExp) {
    fireEvent.click(screen.getByRole('button', { name: label }))
    act(() => {
      vi.advanceTimersByTime(350)
    })
  }

  test('trier les 20 éléments mène au bilan puis transmet les deux listes', async () => {
    vi.useFakeTimers()
    const onSave = vi.fn()
    const onSaveDraft = vi.fn()
    render(
      <CircleOfControlTool
        onSave={onSave}
        onSaveDraft={onSaveDraft}
        initialDraftPromise={Promise.resolve(null)}
      />
    )
    await act(async () => {})

    fireEvent.click(screen.getByRole('button', { name: /Commencer le tri/ }))
    expect(screen.getByText('Item 1 / 20')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: "L'opinion des autres" })).toBeInTheDocument()

    // Pendant l'animation, les boutons sont désactivés et une 2e décision est ignorée
    fireEvent.click(screen.getByRole('button', { name: /C'est sous mon contrôle/ }))
    expect(screen.getByRole('button', { name: /C'est extérieur/ })).toBeDisabled()
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    act(() => {
      vi.advanceTimersByTime(350)
    })
    expect(screen.getByText('Item 2 / 20')).toBeInTheDocument()

    // Flèche droite = sous contrôle
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    act(() => {
      vi.advanceTimersByTime(350)
    })
    expect(screen.getByText('Item 3 / 20')).toBeInTheDocument()

    for (let i = 3; i <= 20; i++) decide(/C'est extérieur/)

    expect(screen.getByText('Analyse terminée !')).toBeInTheDocument()
    expect(screen.getByText("Zones d'Influence").previousSibling).toHaveTextContent('2')
    expect(screen.getByText('Zones de Lâcher-prise').previousSibling).toHaveTextContent('18')
    expect(onSaveDraft).toHaveBeenLastCalledWith(expect.objectContaining({ gameState: 'summary' }))

    fireEvent.click(screen.getByRole('button', { name: 'Transmettre le diagnostic' }))
    const [payload, duration] = onSave.mock.calls[0]
    expect(payload.inControl).toEqual(["L'opinion des autres", 'Le futur'])
    expect(payload.outControl).toHaveLength(18)
    expect(payload.outControl[0]).toBe('Mes limites')
    expect(typeof duration).toBe('number')
  })

  test('reprend un brouillon directement en cours de tri', async () => {
    render(
      <CircleOfControlTool
        onSave={vi.fn()}
        onSaveDraft={vi.fn()}
        initialDraftPromise={Promise.resolve({
          data: { decisions: { '1': 'inside' }, currentIndex: 5, gameState: 'playing' },
        } as any)}
      />
    )
    expect(await screen.findByText('Item 6 / 20')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Le comportement des autres' })).toBeInTheDocument()
  })

  test('reprend un brouillon au bilan', async () => {
    render(
      <CircleOfControlTool
        onSave={vi.fn()}
        onSaveDraft={vi.fn()}
        initialDraftPromise={Promise.resolve({
          data: {
            decisions: { '1': 'inside', '2': 'outside' },
            currentIndex: 19,
            gameState: 'summary',
          },
        } as any)}
      />
    )
    expect(await screen.findByText('Analyse terminée !')).toBeInTheDocument()
  })
})
