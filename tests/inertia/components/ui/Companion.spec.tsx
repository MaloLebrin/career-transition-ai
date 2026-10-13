import { render } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import {
  COMPANION_POSES,
  COMPANION_TONES,
  Companion,
  type CompanionPose,
  type CompanionTone,
} from '~/components/ui/Companion'

const COMBINATIONS: [CompanionPose, CompanionTone][] = COMPANION_POSES.flatMap((pose) =>
  COMPANION_TONES.map((tone): [CompanionPose, CompanionTone] => [pose, tone])
)

const paintsOf = (svg: SVGElement) =>
  Array.from(svg.querySelectorAll('[fill], [stroke], stop'))
    .flatMap((el) => [
      el.getAttribute('fill'),
      el.getAttribute('stroke'),
      el.getAttribute('stop-color'),
    ])
    .filter((value): value is string => Boolean(value) && value !== 'none')

describe('Companion', () => {
  test('rend un svg décoratif, masqué aux lecteurs d’écran, au repos et en 96 px par défaut', () => {
    const { container } = render(<Companion className="mx-auto" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('focusable', 'false')
    expect(svg).toHaveAttribute('viewBox', '0 0 200 200')
    expect(svg).toHaveAttribute('data-pose', 'rest')
    expect(svg).toHaveAttribute('data-tone', 'default')
    expect(svg).toHaveAttribute('data-size', 'md')
    expect(svg).toHaveClass('h-24', 'w-24', 'mx-auto', 'shrink-0')
  })

  test.each([
    ['sm', 'h-12 w-12'],
    ['lg', 'h-40 w-40'],
    ['xl', 'h-60 w-60'],
  ] as const)('la taille %s applique %s', (size, classes) => {
    const { container } = render(<Companion size={size} />)
    expect(container.querySelector('svg')).toHaveClass(...classes.split(' '))
  })

  test.each(COMBINATIONS)(
    'la pose %s en ton %s ne contient aucune couleur en dur',
    (pose, tone) => {
      const { container } = render(<Companion pose={pose} tone={tone} />)
      const svg = container.querySelector('svg')!
      expect(svg).toHaveAttribute('data-pose', pose)
      expect(svg).toHaveAttribute('data-tone', tone)
      const paints = paintsOf(svg)
      expect(paints.length).toBeGreaterThan(0)
      for (const paint of paints) {
        expect(paint).toMatch(/^(var\(--color-[a-z-]+\)|url\(#.+\))$/)
      }
    }
  )

  test.each(COMPANION_POSES)(
    'la pose %s prend les couleurs du héros : panneaux abricot, mécanique mauve, lentille lac, coque claire',
    (pose) => {
      const { container } = render(<Companion pose={pose} />)
      const html = container.querySelector('svg')!.innerHTML
      expect(html).toContain('var(--color-tint-apricot-bold)')
      expect(html).toContain('var(--color-tint-lavender-bold)')
      expect(html).toContain('var(--color-tint-lake-bold)')
      expect(html).toContain('var(--color-surface)')
      expect(html).toContain('var(--color-ink)')
    }
  )

  test.each(COMPANION_POSES)(
    'en ton inverse, la pose %s passe coque et contours en on-ink, la lentille reste encre',
    (pose) => {
      const { container } = render(<Companion pose={pose} tone="inverse" />)
      const svg = container.querySelector('svg')!
      expect(svg.querySelector('[stroke="var(--color-ink)"]')).toBeNull()
      expect(svg.querySelector('[stroke="var(--color-on-ink)"]')).not.toBeNull()
      expect(svg.innerHTML).not.toContain('var(--color-surface)')
      expect(svg.querySelector('[data-face="eyes"] [fill="var(--color-ink)"]')).not.toBeNull()
    }
  )

  test('chaque pose a son accessoire : cadenas, pousse, bulle, étincelles', () => {
    const { container } = render(
      <>
        <Companion pose="guard" />
        <Companion pose="rest" />
        <Companion pose="think" />
        <Companion pose="cheer" />
        <Companion pose="wave" />
      </>
    )
    const [guard, rest, think, cheer, wave] = Array.from(container.querySelectorAll('svg'))
    expect(guard.querySelector('[data-prop="padlock"]')).not.toBeNull()
    expect(rest.querySelector('[data-prop="sprout"]')).not.toBeNull()
    expect(rest.innerHTML).toContain('var(--color-tint-meadow-bold)')
    expect(think.querySelector('[data-prop="bubble"]')).not.toBeNull()
    expect(cheer.querySelector('[data-prop="sparkles"]')).not.toBeNull()
    expect(wave.querySelector('[data-prop]')).toBeNull()
  })

  test('deux instances ont des masques aux identifiants distincts', () => {
    const { container } = render(
      <>
        <Companion />
        <Companion />
      </>
    )
    const ids = Array.from(container.querySelectorAll('clipPath')).map((c) => c.id)
    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(2)
  })

  test('immobile par défaut : aucune classe companion-*', () => {
    for (const pose of COMPANION_POSES) {
      const { container } = render(<Companion pose={pose} />)
      expect(container.querySelector('[class*="companion-"]')).toBeNull()
    }
  })

  test('animé : flottement partout, balancement du dôme, clignement et étincelles selon la pose', () => {
    const { container } = render(
      <>
        <Companion pose="wave" animated />
        <Companion pose="rest" animated />
        <Companion pose="cheer" animated />
      </>
    )
    const [wave, rest, cheer] = Array.from(container.querySelectorAll('svg'))
    for (const svg of [wave, rest, cheer]) {
      expect(svg.querySelector('.companion-float')).not.toBeNull()
    }
    expect(wave.querySelector('.companion-wave')).not.toBeNull()
    expect(rest.querySelector('.companion-blink')).not.toBeNull()
    expect(rest.querySelector('.companion-wave')).toBeNull()
    expect(cheer.querySelector('.companion-sparkle')).not.toBeNull()
    expect(cheer.querySelector('.companion-blink')).toBeNull()
  })
})
