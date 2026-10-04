import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FeatureCard } from '~/components/marketing/FeatureCard'

describe('FeatureCard', () => {
  test('rend le titre en h3, la description et une icône décorative', () => {
    const { container } = render(
      <FeatureCard
        icon={<svg data-testid="icon" />}
        title="Gain de temps"
        description="Vous passez plus de temps sur l’écoute."
      />
    )

    expect(screen.getByRole('heading', { level: 3, name: 'Gain de temps' })).toBeInTheDocument()
    expect(screen.getByText('Vous passez plus de temps sur l’écoute.')).toBeInTheDocument()
    const tile = screen.getByTestId('icon').parentElement
    expect(tile).toHaveAttribute('aria-hidden', 'true')
    expect(tile).toHaveClass('bg-tint-sun', 'text-tint-sun-ink')
    expect(container.firstChild).toHaveClass('rounded-xl')
  })

  test('colore la tuile d’icône selon la teinte demandée', () => {
    render(
      <FeatureCard
        icon={<span data-testid="icon" />}
        title="Données protégées"
        description="Hébergées dans l’Union européenne."
        tint="meadow"
      />
    )

    expect(screen.getByTestId('icon').parentElement).toHaveClass(
      'bg-tint-meadow',
      'text-tint-meadow-ink'
    )
  })
})
