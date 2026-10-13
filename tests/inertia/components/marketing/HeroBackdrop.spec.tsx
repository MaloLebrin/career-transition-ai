import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HeroBackdrop } from '../../../../inertia/components/marketing/HeroBackdrop'

describe('HeroBackdrop', () => {
  test('decorative mesh band with a canvas veil, strong by default', () => {
    render(<HeroBackdrop />)
    const backdrop = screen.getByTestId('hero-backdrop')
    expect(backdrop).toHaveAttribute('aria-hidden', 'true')
    expect(backdrop).toHaveAttribute('data-scene', 'mesh')
    const mesh = backdrop.querySelector('.bg-hero-mesh')
    expect(mesh).toHaveClass('animate-mesh-drift', 'clip-skew-b', 'opacity-90')
    expect(backdrop.querySelector('[class*="from-canvas"]')).not.toBeNull()
    expect(backdrop.querySelector('svg')).toBeNull()
  })

  test('soft intensity for secondary heroes', () => {
    render(<HeroBackdrop intensity="soft" />)
    expect(screen.getByTestId('hero-backdrop').querySelector('.bg-hero-mesh')).toHaveClass(
      'opacity-45'
    )
  })

  test('landscape scene: the hero panorama under a canvas veil, no mesh', () => {
    render(<HeroBackdrop scene="landscape" />)
    const backdrop = screen.getByTestId('hero-backdrop')
    expect(backdrop).toHaveAttribute('data-scene', 'landscape')
    const landscape = backdrop.querySelector('svg[data-variant="hero"]')
    expect(landscape).toHaveAttribute('aria-hidden', 'true')
    expect(landscape?.querySelector('.landscape-cloud')).not.toBeNull()
    expect(backdrop.querySelector('.bg-hero-mesh')).toBeNull()
    expect(backdrop.querySelector('.bg-grid-hairline')).toBeNull()
    expect(backdrop.querySelector('[class*="from-canvas"]')).not.toBeNull()
  })
})
