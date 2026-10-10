import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Parallax } from '../../../../../inertia/components/ui/motion/Parallax'

describe('Parallax', () => {
  test('renders its children without offset under reduced motion', () => {
    render(
      <Parallax className="relative" offset={60}>
        <p>Aperçu</p>
      </Parallax>
    )
    const wrapper = screen.getByText('Aperçu').parentElement
    expect(wrapper).toHaveClass('relative')
    expect(wrapper?.style.transform ?? '').not.toContain('translateY')
  })
})
