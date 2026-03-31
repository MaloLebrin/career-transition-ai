import { describe, test, expect, vi } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
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
