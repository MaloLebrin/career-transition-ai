import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CountUp } from '../../../../../inertia/components/ui/motion/CountUp'

describe('CountUp', () => {
  test('renders the final value, formatted in French', () => {
    render(<CountUp value={12500} />)
    expect(screen.getByText(/12\s500/)).toHaveClass('tabular-nums')
  })

  test('accepts a custom format', () => {
    render(<CountUp value={149} format={(n) => `${Math.round(n)} €`} className="font-display" />)
    expect(screen.getByText('149 €')).toHaveClass('font-display')
  })
})
