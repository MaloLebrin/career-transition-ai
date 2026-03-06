import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import TargetingTool from '../../../inertia/components/exercises/TargetingTool'

vi.mock('../../../inertia/services/geminiService', () => ({
  suggestTargets: vi.fn().mockResolvedValue({
    companies: ['AFPA', "L'Oréal"],
    sectors: ['Formation professionnelle'],
  }),
}))

describe('TargetingTool', () => {
  const onSave = vi.fn()

  beforeEach(() => {
    onSave.mockReset()
  })

  test('renders intro and add-manual button', () => {
    render(<TargetingTool onSave={onSave} />)

    expect(screen.getByText(/Ciblage & Plan d'Action/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Identifiez les structures qui correspondent à votre projet professionnel/i)
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ajouter manuellement/i })).toBeInTheDocument()
  })

  test('allows adding a manual target and saving it', () => {
    render(<TargetingTool onSave={onSave} />)

    const addButton = screen.getByRole('button', { name: /Ajouter manuellement/i })
    act(() => {
      addButton.click()
    })

    const nameInput = screen.getByPlaceholderText(/AFPA, L'Oréal, Startup X/i)
    act(() => {
      nameInput.focus()
      // @ts-expect-error jsdom typing
      nameInput.value = 'AFPA'
      nameInput.dispatchEvent(new Event('input', { bubbles: true }))
    })

    const saveButton = screen.getByRole('button', { name: /Valider mon ciblage expert/i })
    act(() => {
      saveButton.click()
    })

    expect(onSave).toHaveBeenCalledTimes(1)
    const [payload] = onSave.mock.calls[0]
    expect(payload.targets).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'AFPA' })])
    )
  })
})
