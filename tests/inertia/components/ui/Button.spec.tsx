import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Button from '../../../../inertia/components/ui/Button'

describe('Button', () => {
  test('renders children and default variant/size', () => {
    render(<Button>Cliquer</Button>)
    const btn = screen.getByRole('button', { name: /Cliquer/ })
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveAttribute('type', 'button')
  })

  test('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>OK</Button>)
    fireEvent.click(screen.getByRole('button', { name: 'OK' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('shows loading state and sets aria-busy', () => {
    render(<Button isLoading>Chargement</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveAttribute('aria-busy', 'true')
    expect(btn).toBeDisabled()
  })

  test('is disabled when disabled prop is true', () => {
    render(<Button disabled>Désactivé</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  test('renders with icon when icon prop provided', () => {
    render(<Button icon={<span data-testid="icon">I</span>}>Avec icône</Button>)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Avec icône/ })).toBeInTheDocument()
  })

  test('supports type submit', () => {
    render(<Button type="submit">Envoyer</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })
})
