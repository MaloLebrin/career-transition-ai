import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RevealGroup } from '../../../../../inertia/components/ui/motion/RevealGroup'
import { RevealItem } from '../../../../../inertia/components/ui/motion/RevealItem'

describe('RevealGroup / RevealItem', () => {
  test('renders its items statically under reduced motion', () => {
    render(
      <RevealGroup className="grid gap-4">
        <RevealItem className="card">Premier</RevealItem>
        <RevealItem>Second</RevealItem>
      </RevealGroup>
    )

    const first = screen.getByText('Premier')
    expect(first).toHaveClass('card')
    expect(first.parentElement).toHaveClass('grid gap-4')
    expect(first).not.toHaveStyle({ opacity: '0' })
    expect(screen.getByText('Second')).toBeInTheDocument()
  })
})
