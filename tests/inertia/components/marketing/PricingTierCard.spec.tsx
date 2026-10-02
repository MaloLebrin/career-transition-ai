import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PricingTierCard, type PricingTierCardProps } from '~/components/marketing/PricingTierCard'
import { resetInertiaMock } from '../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../support/inertia_mock')
  return inertiaMock()
})

const baseProps: PricingTierCardProps = {
  name: 'Essentiel',
  tagline: 'Démarrer ou petit cabinet',
  priceLabel: 'À partir de 149 €',
  priceSuffix: '/ mois HT',
  footnote: 'Jusqu’à 2 sièges conseiller',
  features: ['Exercices et parcours candidat', 'Support email'],
  ctaHref: '#demo',
  ctaLabel: 'Demander un devis',
}

describe('PricingTierCard', () => {
  beforeEach(() => resetInertiaMock())

  test('rend le nom en h3, le prix, les fonctionnalités et le lien d’action', () => {
    const { container } = render(<PricingTierCard {...baseProps} />)

    expect(screen.getByRole('heading', { level: 3, name: 'Essentiel' })).toBeInTheDocument()
    expect(screen.getByText('À partir de 149 €')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    const cta = screen.getByRole('link', { name: 'Demander un devis' })
    expect(cta).toHaveAttribute('href', '#demo')
    expect(cta).toHaveClass('border-hairline-strong')
    expect(screen.queryByText('Recommandé')).not.toBeInTheDocument()
    expect(container.firstChild).toHaveClass('bg-surface')
  })

  test('la version featured est la carte sombre avec le badge Recommandé', () => {
    const { container } = render(<PricingTierCard {...baseProps} name="Professionnel" featured />)

    expect(container.firstChild).toHaveClass('bg-ink')
    expect(screen.getByText('Recommandé')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Professionnel' })).toHaveClass(
      'text-on-ink'
    )
    // Sur ink, le bouton plein est le soleil : un bouton encre serait invisible.
    expect(screen.getByRole('link', { name: 'Demander un devis' })).toHaveClass(
      'bg-sun',
      'text-ink'
    )
    expect(container.querySelector('.text-accent-on-ink')).toBeInTheDocument()
  })
})
