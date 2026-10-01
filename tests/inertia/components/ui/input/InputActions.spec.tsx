import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { InputActions } from '../../../../../inertia/components/ui/input/InputActions'

describe('InputActions', () => {
  test('renders nothing when no action is enabled', () => {
    const { container } = render(
      <InputActions
        showClear={false}
        onClear={() => {}}
        showPasswordToggle={false}
        passwordVisible={false}
        onTogglePassword={() => {}}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  test('triggers clear and password toggle callbacks', () => {
    const onClear = vi.fn()
    const onToggle = vi.fn()
    render(
      <InputActions
        showClear
        onClear={onClear}
        showPasswordToggle
        passwordVisible={false}
        onTogglePassword={onToggle}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Vider le champ' }))
    fireEvent.click(screen.getByRole('button', { name: 'Afficher le mot de passe' }))
    expect(onClear).toHaveBeenCalledTimes(1)
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  test('labels the toggle for hiding when the password is visible', () => {
    render(
      <InputActions
        showClear={false}
        onClear={() => {}}
        showPasswordToggle
        passwordVisible
        onTogglePassword={() => {}}
      />
    )
    expect(screen.getByRole('button', { name: 'Masquer le mot de passe' })).toBeInTheDocument()
  })
})
