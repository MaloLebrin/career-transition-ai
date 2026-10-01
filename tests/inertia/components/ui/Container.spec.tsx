import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { Container } from '../../../../inertia/components/ui/Container'

describe('Container', () => {
  test('renders a centred marketing-width div by default', () => {
    render(<Container data-testid="c">Contenu</Container>)
    const el = screen.getByTestId('c')
    expect(el.tagName).toBe('DIV')
    expect(el).toHaveClass('max-w-marketing', 'mx-auto', 'px-6')
  })

  test('supports narrow size and a custom tag', () => {
    render(
      <Container as="section" size="narrow" className="py-4" data-testid="c">
        Doc
      </Container>
    )
    const el = screen.getByTestId('c')
    expect(el.tagName).toBe('SECTION')
    expect(el).toHaveClass('max-w-3xl', 'py-4')
  })
})
