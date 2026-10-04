import { render } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { LandscapeArt, type LandscapeArtVariant } from '~/components/marketing/LandscapeArt'

const VARIANTS: LandscapeArtVariant[] = ['hero', 'dusk', 'horizon']

describe('LandscapeArt', () => {
  test('rend un svg décoratif, masqué aux lecteurs d’écran, en panorama par défaut', () => {
    const { container } = render(<LandscapeArt className="rounded-2xl" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('focusable', 'false')
    expect(svg).toHaveAttribute('data-variant', 'hero')
    expect(svg).toHaveAttribute('preserveAspectRatio', 'xMidYMax slice')
    expect(svg).toHaveClass('w-full', 'h-full', 'rounded-2xl')
  })

  test.each(VARIANTS)('la variante %s ne contient aucune couleur en dur', (variant) => {
    const { container } = render(<LandscapeArt variant={variant} />)
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('data-variant', variant)
    const paints = Array.from(svg.querySelectorAll('[fill], [stroke], stop'))
      .flatMap((el) => [
        el.getAttribute('fill'),
        el.getAttribute('stroke'),
        el.getAttribute('stop-color'),
      ])
      .filter((value): value is string => Boolean(value) && value !== 'none')
    expect(paints.length).toBeGreaterThan(0)
    for (const paint of paints) {
      expect(paint).toMatch(/^(var\(--color-[a-z-]+\)|url\(#.+\))$/)
    }
  })

  test('chaque variante dessine le soleil, les montagnes ou le lac avec les teintes expressives', () => {
    const { container } = render(
      <>
        <LandscapeArt variant="hero" />
        <LandscapeArt variant="dusk" />
        <LandscapeArt variant="horizon" />
      </>
    )
    const [hero, dusk, horizon] = Array.from(container.querySelectorAll('svg'))
    expect(hero.innerHTML).toContain('var(--color-tint-sun-bold)')
    expect(hero.innerHTML).toContain('var(--color-tint-meadow-bold)')
    expect(dusk.innerHTML).toContain('var(--color-accent-on-ink)')
    expect(horizon.innerHTML).toContain('var(--color-tint-lavender)')
    expect(horizon.innerHTML).not.toContain('var(--color-tint-sun-bold)')
  })

  test('deux instances ont des dégradés aux identifiants distincts', () => {
    const { container } = render(
      <>
        <LandscapeArt />
        <LandscapeArt />
      </>
    )
    const ids = Array.from(container.querySelectorAll('linearGradient')).map((g) => g.id)
    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(2)
  })

  test('la variante hero anime nuages, oiseaux, halo du soleil et reflets du lac', () => {
    const { container } = render(<LandscapeArt variant="hero" />)
    for (const name of [
      'landscape-cloud',
      'landscape-birds',
      'landscape-sun-halo',
      'landscape-ripple',
    ]) {
      expect(container.querySelector(`.${name}`)).not.toBeNull()
    }
  })

  test.each(['dusk', 'horizon'] as const)('la variante %s reste immobile', (variant) => {
    const { container } = render(<LandscapeArt variant={variant} />)
    expect(container.querySelector('[class*="landscape-"]')).toBeNull()
  })
})
