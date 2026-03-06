import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Card from '../../../../inertia/components/ui/Card'

describe('Card', () => {
  test('renders children', () => {
    render(<Card>Contenu</Card>)
    expect(screen.getByText('Contenu')).toBeInTheDocument()
  })

  test('applies default variant styles', () => {
    const { container } = render(<Card>X</Card>)
    const div = container.firstElementChild
    expect(div).toHaveClass('rounded-3xl', 'p-8')
  })

  test('applies variant and className', () => {
    const { container } = render(
      <Card variant="dark" className="custom">
        Y
      </Card>
    )
    const div = container.firstElementChild
    expect(div).toHaveClass('bg-brand-navy', 'custom')
  })

  test('forwards other div props', () => {
    render(
      <Card data-testid="card" id="my-card">
        Z
      </Card>
    )
    const card = screen.getByTestId('card')
    expect(card).toHaveAttribute('id', 'my-card')
  })
})
