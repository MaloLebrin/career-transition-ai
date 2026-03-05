import { describe, test, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import ValuesTool from '../../../inertia/components/exercises/ValuesTool'

describe('ValuesTool', () => {
  test('renders intro and allows ranking a value', () => {
    const onSave = vi.fn()
    const onSaveDraft = vi.fn()

    render(<ValuesTool onSave={onSave} onSaveDraft={onSaveDraft} />)

    // Intro content
    expect(screen.getByText(/Classement des Valeurs/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Classez les 10 valeurs universelles de Schwartz/i)
    ).toBeInTheDocument()

    // Click the first available value button
    const valueButtons = screen.getAllByRole('button')
    const firstValueButton = valueButtons[0]

    act(() => {
      firstValueButton.click()
    })

    // Draft should have been saved after state change
    expect(onSaveDraft).toHaveBeenCalled()

    // The hierarchy counter should reflect 1 selected value
    expect(
      screen.getByText(/Votre hiérarchie \(1\/10\)/i)
    ).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })
})

