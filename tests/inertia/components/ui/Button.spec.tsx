import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Button, { buttonClassName } from '../../../../inertia/components/ui/Button'

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

  test('applies the primary tone and never uppercases small sizes', () => {
    render(<Button size="sm">Petit</Button>)
    const btn = screen.getByRole('button', { name: 'Petit' })
    expect(btn).toHaveClass('bg-primary', 'h-9', 'rounded-lg')
    expect(btn).not.toHaveClass('uppercase')
  })

  test('maps the deprecated emphasis variant and xs size onto secondary / sm', () => {
    render(
      <Button variant="emphasis" size="xs">
        Ancien
      </Button>
    )
    const btn = screen.getByRole('button', { name: 'Ancien' })
    expect(btn).toHaveClass('bg-sun', 'text-ink', 'h-9')
  })

  test('secondary is the sun button and the deprecated cta variant maps onto it', () => {
    render(
      <>
        <Button variant="secondary">Soleil</Button>
        <Button variant="cta">Ancien CTA</Button>
      </>
    )
    expect(screen.getByRole('button', { name: 'Soleil' })).toHaveClass(
      'bg-sun',
      'text-ink',
      'hover:bg-sun-pressed'
    )
    expect(screen.getByRole('button', { name: 'Ancien CTA' })).toHaveClass('bg-sun')
    expect(screen.getByRole('button', { name: 'Soleil' })).toHaveClass(
      'focus-visible:ring-accent/40'
    )
  })

  test('buttonClassName exposes the same classes for link-shaped buttons', () => {
    const classes = buttonClassName({ variant: 'outline', size: 'lg', className: 'w-full' })
    expect(classes).toContain('border-hairline-strong')
    expect(classes).toContain('h-12')
    expect(classes).toContain('w-full')
  })
})
