import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Badge from '../../../../inertia/components/ui/Badge'

describe('Badge', () => {
  test('renders children with default variant', () => {
    render(<Badge>Slate</Badge>)
    expect(screen.getByText('Slate')).toBeInTheDocument()
  })

  test('applies variant styles', () => {
    const { container } = render(<Badge variant="pink">Pink</Badge>)
    const span = container.firstElementChild
    expect(span).toHaveClass('text-rose-600', 'border-rose-100')
  })

  test('forwards className and other span props', () => {
    render(
      <Badge className="extra" data-testid="badge">
        X
      </Badge>
    )
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveClass('extra')
  })
})
