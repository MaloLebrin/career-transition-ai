import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { Eyebrow } from '../../../../inertia/components/ui/Eyebrow'

describe('Eyebrow', () => {
  test('renders sentence-case text in the primary tone by default', () => {
    render(<Eyebrow>Pour les cabinets</Eyebrow>)
    const el = screen.getByText('Pour les cabinets')
    expect(el).toHaveClass('text-eyebrow', 'text-primary')
    expect(el).not.toHaveClass('uppercase')
  })

  test('renders an icon and the inverse tone', () => {
    render(
      <Eyebrow tone="inverse" icon={<svg data-testid="icon" />}>
        Sur fond sombre
      </Eyebrow>
    )
    expect(screen.getByTestId('icon')).toBeInTheDocument()
    expect(screen.getByText('Sur fond sombre')).toHaveClass('text-primary-on-ink')
  })
})
