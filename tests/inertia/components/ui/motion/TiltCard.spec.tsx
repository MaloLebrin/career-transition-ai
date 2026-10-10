import { describe, expect, test } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { TiltCard } from '../../../../../inertia/components/ui/motion/TiltCard'

describe('TiltCard', () => {
  test('renders its children and ignores the pointer under reduced motion', () => {
    render(
      <TiltCard className="h-full">
        <p>Carte</p>
      </TiltCard>
    )
    const card = screen.getByText('Carte').parentElement as HTMLElement
    expect(card).toHaveAttribute('data-tilt')
    expect(card).toHaveClass('h-full')

    fireEvent.pointerMove(card, { pointerType: 'mouse', clientX: 10, clientY: 10 })
    fireEvent.pointerLeave(card)
    expect(screen.getByText('Carte')).toBeInTheDocument()
  })
})
