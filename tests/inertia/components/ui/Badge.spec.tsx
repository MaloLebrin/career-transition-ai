import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Badge from '../../../../inertia/components/ui/Badge'

describe('Badge', () => {
  test('renders children with default variant', () => {
    render(<Badge>Slate</Badge>)
    expect(screen.getByText('Slate')).toBeInTheDocument()
  })

  test('applies semantic tone styles without uppercase', () => {
    const { container } = render(<Badge variant="danger">Erreur</Badge>)
    const span = container.firstElementChild
    expect(span).toHaveClass('text-danger', 'bg-danger-soft', 'text-caption')
    expect(span).not.toHaveClass('uppercase')
  })

  test('maps legacy colour names onto semantic tones', () => {
    const { container } = render(
      <>
        <Badge variant="pink">Pink</Badge>
        <Badge variant="slate">Slate</Badge>
        <Badge variant="emerald">Emerald</Badge>
      </>
    )
    const [pink, slate, emerald] = Array.from(container.children)
    expect(pink).toHaveClass('text-tint-terracotta-ink')
    expect(slate).toHaveClass('text-muted')
    expect(emerald).toHaveClass('text-success')
  })

  test('renders a status dot when asked', () => {
    const { container } = render(
      <Badge variant="success" dot>
        Actif
      </Badge>
    )
    expect(container.querySelector('span[aria-hidden="true"]')).toHaveClass('bg-current')
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
