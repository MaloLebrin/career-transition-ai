import { describe, expect, test } from 'vitest'
import { render } from '@testing-library/react'
import { TeamMonogram } from '~/components/marketing/about/TeamMonogram'

describe('TeamMonogram', () => {
  test('affiche les initiales sur un disque teinté, masqué aux lecteurs d’écran', () => {
    const { container } = render(<TeamMonogram firstName="Claire" lastName="Morel" />)
    const monogram = container.firstElementChild as HTMLElement

    expect(monogram).toHaveTextContent('CM')
    expect(monogram).toHaveAttribute('aria-hidden', 'true')
    expect(monogram).toHaveClass('rounded-full', 'bg-tint-lake', 'text-tint-lake-ink', 'h-16')
  })

  test('accepte une teinte et une petite taille', () => {
    const { container } = render(
      <TeamMonogram firstName="Julien" lastName="Ferrand" tint="blossom" size="sm" />
    )
    const monogram = container.firstElementChild as HTMLElement

    expect(monogram).toHaveTextContent('JF')
    expect(monogram).toHaveClass('bg-tint-blossom', 'text-tint-blossom-ink', 'h-10')
  })
})
