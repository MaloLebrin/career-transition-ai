import { describe, test, expect, vi } from 'vitest'
import { render, screen, act, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ValuesTool from '../../../inertia/components/exercises/ValuesTool'
import { SCHWARTZ_VALUES } from '../../../inertia/constants/values'

describe('ValuesTool', () => {
  test('renders intro and allows ranking a value', () => {
    const onSave = vi.fn()
    const onSaveDraft = vi.fn()

    render(<ValuesTool onSave={onSave} onSaveDraft={onSaveDraft} />)

    // Intro content
    expect(screen.getByText(/Classement des Valeurs/i)).toBeInTheDocument()
    expect(screen.getByText(/Classez les 10 valeurs universelles de Schwartz/i)).toBeInTheDocument()

    // Click the first available value button
    const valueButtons = screen.getAllByRole('button')
    const firstValueButton = valueButtons[0]

    act(() => {
      firstValueButton.click()
    })

    // Draft should have been saved after state change
    expect(onSaveDraft).toHaveBeenCalled()

    // The hierarchy counter should reflect 1 selected value
    expect(screen.getByText(/Votre hiérarchie \(1\/10\)/i)).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  test('allows reordering ranked values via drag and drop', () => {
    const onSave = vi.fn()
    const onSaveDraft = vi.fn()

    render(<ValuesTool onSave={onSave} onSaveDraft={onSaveDraft} />)

    act(() => {
      const b0 = screen.getByText(SCHWARTZ_VALUES[0].label).closest('button')
      expect(b0).toBeTruthy()
      b0!.click()
    })
    act(() => {
      const b1 = screen.getByText(SCHWARTZ_VALUES[1].label).closest('button')
      expect(b1).toBeTruthy()
      b1!.click()
    })

    // After two picks, we should have two ranked items.
    const items = Array.from(document.querySelectorAll('[data-testid^="ranked-value-"]')) as HTMLElement[]
    expect(items.length).toBeGreaterThanOrEqual(2)
    const first = items[0]
    const second = items[1]

    fireEvent.dragStart(second)
    fireEvent.dragOver(first)
    fireEvent.drop(first)

    // Order should be swapped: the element that used to be second should now be first in DOM.
    const after = Array.from(document.querySelectorAll('[data-testid^="ranked-value-"]')) as HTMLElement[]
    expect(after[0].getAttribute('data-testid')).toEqual(second.getAttribute('data-testid'))
  })
})

describe('ValuesTool — parcours complet', () => {
  async function rankAll(user: ReturnType<typeof userEvent.setup>) {
    for (const value of SCHWARTZ_VALUES) {
      await user.click(screen.getByText(value.label).closest('button')!)
    }
  }

  test('retirer une valeur classée la remet dans la liste à classer', async () => {
    const user = userEvent.setup()
    render(<ValuesTool onSave={vi.fn()} onSaveDraft={vi.fn()} />)

    await user.click(screen.getByText(SCHWARTZ_VALUES[2].label).closest('button')!)
    expect(screen.getByText('Valeurs à classer (9)')).toBeInTheDocument()

    const ranked = screen.getByTestId(`ranked-value-${SCHWARTZ_VALUES[2].label}`)
    await user.click(within(ranked).getByRole('button'))

    expect(screen.getByText('Valeurs à classer (10)')).toBeInTheDocument()
    expect(screen.getByText(/Votre hiérarchie \(0\/10\)/)).toBeInTheDocument()
  })

  test('un glisser-déposer hors d’une valeur classée ne change pas l’ordre', () => {
    render(<ValuesTool onSave={vi.fn()} onSaveDraft={vi.fn()} />)
    fireEvent.click(screen.getByText(SCHWARTZ_VALUES[0].label).closest('button')!)
    fireEvent.click(screen.getByText(SCHWARTZ_VALUES[1].label).closest('button')!)

    const first = screen.getByTestId(`ranked-value-${SCHWARTZ_VALUES[0].label}`)
    fireEvent.dragStart(first)
    fireEvent.drop(first.parentElement!)
    fireEvent.dragEnd(first)
    // Déposer sur soi-même : aucun changement
    fireEvent.dragStart(first)
    fireEvent.drop(first)

    const order = screen.getAllByTestId(/^ranked-value-/).map((el) => el.dataset.testid)
    expect(order).toEqual([
      `ranked-value-${SCHWARTZ_VALUES[0].label}`,
      `ranked-value-${SCHWARTZ_VALUES[1].label}`,
    ])
  })

  test('après 10 valeurs, passe aux figures d’inspiration et enregistre le tout', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const onSaveDraft = vi.fn()
    render(<ValuesTool onSave={onSave} onSaveDraft={onSaveDraft} />)

    expect(screen.queryByRole('button', { name: /Suivant/ })).not.toBeInTheDocument()
    await rankAll(user)
    await user.click(screen.getByRole('button', { name: 'Suivant : Figures marquantes' }))

    expect(screen.getByText("Les Figures d'Inspiration")).toBeInTheDocument()
    const names = screen.getAllByPlaceholderText('Nom de la personne')
    const values = screen.getAllByPlaceholderText(/Quelles valeurs cette personne/)
    expect(names).toHaveLength(3)

    await user.type(names[0], 'Marie Curie')
    await user.type(values[0], 'Persévérance')
    await user.type(names[2], 'Mandela')

    expect(onSaveDraft).toHaveBeenLastCalledWith(
      expect.objectContaining({ step: 2, selectedValues: SCHWARTZ_VALUES.map((v) => v.label) })
    )

    // Retour au classement puis retour : les figures sont conservées
    await user.click(screen.getByRole('button', { name: 'Retour au classement' }))
    await user.click(screen.getByRole('button', { name: 'Suivant : Figures marquantes' }))
    expect(screen.getAllByPlaceholderText('Nom de la personne')[0]).toHaveValue('Marie Curie')

    await user.click(screen.getByRole('button', { name: 'Enregistrer mon profil de valeurs' }))
    expect(onSave).toHaveBeenCalledWith(
      {
        selectedValues: SCHWARTZ_VALUES.map((v) => v.label),
        peopleExercise: [
          { name: 'Marie Curie', values: 'Persévérance' },
          { name: '', values: '' },
          { name: 'Mandela', values: '' },
        ],
      },
      expect.any(Number)
    )
  })

  test('restaure un brouillon à l’étape 2', async () => {
    const draft = {
      data: {
        selectedValues: SCHWARTZ_VALUES.map((v) => v.label),
        peopleExercise: [
          { name: 'Gandhi', values: 'Paix' },
          { name: '', values: '' },
          { name: '', values: '' },
        ],
        step: 2,
      },
    }
    render(
      <ValuesTool onSave={vi.fn()} onSaveDraft={vi.fn()} initialDraftPromise={Promise.resolve(draft as never)} />
    )
    expect(await screen.findByDisplayValue('Gandhi')).toBeInTheDocument()
  })

  test('brouillon partiel : valeurs par défaut et étape 1', async () => {
    render(
      <ValuesTool onSave={vi.fn()} onSaveDraft={vi.fn()} initialDraftPromise={Promise.resolve({ data: {} } as never)} />
    )
    await waitFor(() => expect(screen.getByText(/Votre hiérarchie \(0\/10\)/)).toBeInTheDocument())
  })
})
