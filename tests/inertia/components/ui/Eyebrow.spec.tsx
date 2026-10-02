import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { Eyebrow } from '../../../../inertia/components/ui/Eyebrow'

describe('Eyebrow', () => {
  test('renders sentence-case text in the accent tone by default', () => {
    render(<Eyebrow>Pour les cabinets</Eyebrow>)
    const el = screen.getByText('Pour les cabinets')
    expect(el).toHaveClass('text-eyebrow', 'text-accent')
    expect(el).not.toHaveClass('uppercase')
  })

  test('renders an icon and the inverse tone', () => {
    render(
      <Eyebrow tone="inverse" icon={<svg data-testid="icon" />}>
        Sur fond sombre
      </Eyebrow>
    )
    expect(screen.getByTestId('icon')).toBeInTheDocument()
    expect(screen.getByText('Sur fond sombre')).toHaveClass('text-accent-on-ink')
  })

  test('maps the deprecated primary tone onto accent', () => {
    render(<Eyebrow tone="primary">Ancien</Eyebrow>)
    expect(screen.getByText('Ancien')).toHaveClass('text-accent')
  })
})
