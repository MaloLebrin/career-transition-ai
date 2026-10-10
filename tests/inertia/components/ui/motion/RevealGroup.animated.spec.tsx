import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>()
  return { ...actual, useReducedMotion: () => false }
})

const { RevealGroup } = await import('../../../../../inertia/components/ui/motion/RevealGroup')
const { RevealItem } = await import('../../../../../inertia/components/ui/motion/RevealItem')
const { CountUp } = await import('../../../../../inertia/components/ui/motion/CountUp')

describe('motion primitives (animated path)', () => {
  test('items start hidden until the group enters the viewport', () => {
    render(
      <RevealGroup>
        <RevealItem>Caché</RevealItem>
      </RevealGroup>
    )
    expect(screen.getByText('Caché')).toHaveStyle({ opacity: '0' })
  })

  test('CountUp shows the final value before entering the viewport', () => {
    render(<CountUp value={8} />)
    expect(screen.getByText('8')).toBeInTheDocument()
  })
})
