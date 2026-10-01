import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MarketingSection } from '~/components/marketing/MarketingSection'

describe('MarketingSection', () => {
  test('rend une section canvas par défaut avec son contenu', () => {
    const { container } = render(
      <MarketingSection>
        <p>Contenu</p>
      </MarketingSection>
    )

    const section = container.querySelector('section')
    expect(section).toHaveClass('bg-canvas')
    expect(screen.getByText('Contenu')).toBeInTheDocument()
  })

  test('applique la surface du ton demandé et transmet id et className', () => {
    const { container } = render(
      <MarketingSection tone="ink" id="demo" className="scroll-mt-16">
        <p>Contenu</p>
      </MarketingSection>
    )

    const section = container.querySelector('section')
    expect(section).toHaveAttribute('id', 'demo')
    expect(section).toHaveClass('bg-ink', 'text-on-ink', 'scroll-mt-16')
  })

  test('le ton surface ajoute les bordures hairline', () => {
    const { container } = render(
      <MarketingSection tone="surface">
        <p>Contenu</p>
      </MarketingSection>
    )

    expect(container.querySelector('section')).toHaveClass('bg-surface', 'border-hairline')
  })
})
