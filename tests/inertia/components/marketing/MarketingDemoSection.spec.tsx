import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MarketingDemoSection } from '~/components/marketing/MarketingDemoSection'
import { resetInertiaMock } from '../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../support/inertia_mock')
  return inertiaMock()
})

describe('MarketingDemoSection', () => {
  beforeEach(() => resetInertiaMock())

  test('rend l’en-tête, le formulaire de démo et l’ancre par défaut', () => {
    const { container } = render(
      <MarketingDemoSection
        title="Voyons si c’est un fit pour votre cabinet."
        description="Décrivez votre organisation."
      />
    )

    const section = container.querySelector('section')
    expect(section).toHaveAttribute('id', 'demo')
    expect(section).toHaveClass('bg-surface')
    expect(
      screen.getByRole('heading', { level: 2, name: 'Voyons si c’est un fit pour votre cabinet.' })
    ).toBeInTheDocument()
    // Eyebrow par défaut + bouton d'envoi de la variante démo.
    expect(screen.getAllByText('Demander une démo')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Demander une démo' })).toBeInTheDocument()
  })

  test('accepte un id, un ton, la variante contact et des enfants', () => {
    const { container } = render(
      <MarketingDemoSection
        id="contact"
        tone="soft"
        variant="contact"
        eyebrow="Une question ?"
        title="Intéressé par la méthodologie ?"
        description="Nous répondons sous 48h."
      >
        <a href="#top">Retour en haut</a>
      </MarketingDemoSection>
    )

    const section = container.querySelector('section')
    expect(section).toHaveAttribute('id', 'contact')
    expect(section).toHaveClass('bg-surface-soft')
    expect(screen.getByText('Une question ?')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Retour en haut' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Envoyer le message' })).toBeInTheDocument()
  })
})
