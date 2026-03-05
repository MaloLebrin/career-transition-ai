import { describe, test, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import LifeCurveTool from '../../../inertia/components/exercises/LifeCurveTool'

describe('LifeCurveTool', () => {
  const onSave = vi.fn()
  const onSaveDraft = vi.fn()

  test('renders intro and allows adding a point', () => {
    render(
      <LifeCurveTool
        onSave={onSave}
        onSaveDraft={onSaveDraft}
      />
    )

    expect(screen.getByText(/La courbe de vie/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Tracez l'évolution de votre satisfaction professionnelle/i)
    ).toBeInTheDocument()

    const labelInput = screen.getByPlaceholderText(/Premier poste chez/i)

    act(() => {
      // @ts-expect-error jsdom typing
      labelInput.value = 'Premier poste'
      labelInput.dispatchEvent(new Event('input', { bubbles: true }))
    })

    const addButton = screen.getByRole('button', { name: /Ajouter au graphique/i })
    act(() => {
      addButton.click()
    })

    expect(onSaveDraft).toHaveBeenCalled()
  })
})

