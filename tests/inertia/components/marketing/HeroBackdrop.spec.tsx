import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HeroBackdrop } from '../../../../inertia/components/marketing/HeroBackdrop'

describe('HeroBackdrop', () => {
  test('decorative mesh band with a canvas veil, strong by default', () => {
    render(<HeroBackdrop />)
    const backdrop = screen.getByTestId('hero-backdrop')
    expect(backdrop).toHaveAttribute('aria-hidden', 'true')
    const mesh = backdrop.querySelector('.bg-hero-mesh')
    expect(mesh).toHaveClass('animate-mesh-drift', 'clip-skew-b', 'opacity-90')
    expect(backdrop.querySelector('[class*="from-canvas"]')).not.toBeNull()
  })

  test('soft intensity for secondary heroes', () => {
    render(<HeroBackdrop intensity="soft" />)
    expect(screen.getByTestId('hero-backdrop').querySelector('.bg-hero-mesh')).toHaveClass(
      'opacity-45'
    )
  })
})
