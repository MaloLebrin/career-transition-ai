import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { CompanionShowcase } from '~/components/design-system/sections/CompanionShowcase'

describe('CompanionShowcase', () => {
  test('présente les cinq postures dans les deux tons, animées', () => {
    const { container } = render(<CompanionShowcase />)
    expect(screen.getByRole('heading', { level: 2, name: 'Compagnon' })).toBeInTheDocument()
    expect(container.querySelectorAll('svg[data-pose]')).toHaveLength(10)
    expect(container.querySelectorAll('svg[data-tone="inverse"]')).toHaveLength(5)
    expect(container.querySelectorAll('.companion-float')).toHaveLength(10)
    expect(screen.getByText('Sur ink').nextElementSibling).toHaveClass('bg-ink')
  })
})
