import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { SectionHeading } from '../../../../inertia/components/ui/SectionHeading'

describe('SectionHeading', () => {
  test('renders eyebrow, h2 title and description by default', () => {
    render(
      <SectionHeading
        eyebrow="Méthode"
        title="Un parcours structuré"
        description="Huit exercices."
      />
    )
    expect(screen.getByText('Méthode')).toBeInTheDocument()
    const heading = screen.getByRole('heading', { level: 2, name: 'Un parcours structuré' })
    expect(heading).toHaveClass('text-display-sm', 'md:text-display-md')
    expect(screen.getByText('Huit exercices.')).toHaveClass('text-muted')
  })

  test('supports h1 level, display-xl size, centred alignment and inverse tone', () => {
    render(
      <SectionHeading level={1} size="display-xl" align="center" tone="inverse" title="Titre" />
    )
    const heading = screen.getByRole('heading', { level: 1, name: 'Titre' })
    expect(heading).toHaveClass('md:text-display-xl', 'text-on-ink')
    expect(heading.parentElement).toHaveClass('text-center')
  })
})
