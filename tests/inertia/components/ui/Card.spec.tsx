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
    expect(div).toHaveClass('rounded-xl', 'p-8', 'bg-surface')
  })

  test('applies variant and className', () => {
    const { container } = render(
      <Card variant="dark" className="custom">
        Y
      </Card>
    )
    const div = container.firstElementChild
    expect(div).toHaveClass('bg-ink', 'custom')
  })

  test('applies padding and interactive options', () => {
    const { container } = render(
      <Card padding="md" interactive>
        P
      </Card>
    )
    const div = container.firstElementChild
    expect(div).toHaveClass('p-6', 'hover:shadow-raised')
    expect(div).not.toHaveClass('p-8')
  })

  test('maps deprecated variants onto the new tones', () => {
    const { container } = render(
      <>
        <Card variant="amber">A</Card>
        <Card variant="warm">W</Card>
        <Card variant="sage">S</Card>
      </>
    )
    const [amber, warm, sage] = Array.from(container.children)
    expect(amber).toHaveClass('bg-sun-soft')
    expect(warm).toHaveClass('bg-sun-soft')
    expect(sage).toHaveClass('bg-accent-soft')
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
