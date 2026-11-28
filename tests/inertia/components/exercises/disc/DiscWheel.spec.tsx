import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { DiscWheel } from '../../../../../inertia/components/exercises/disc/DiscWheel'

const FACILITANT_PROFILE = { D: 20, I: 85, S: 75, C: 25 }

describe('DiscWheel', () => {
  test('affiche les huit zones, focusables et nommées', () => {
    render(<DiscWheel percent={FACILITANT_PROFILE} />)
    const wheel = screen.getByTestId('disc-wheel')
    const labels = [
      'Organisant',
      'Directif',
      'Promoteur',
      'Expansif',
      'Facilitant',
      'Coopératif',
      'Coordonnant',
      'Consciencieux',
    ]
    labels.forEach((label) => {
      const zone = within(wheel).getByRole('button', {
        name: new RegExp(`^Zone ${label} \\(trait`),
      })
      expect(zone).toHaveAttribute('tabindex', '0')
    })
  })

  test('le survol d’une zone ouvre sa carte, la sortie la ferme', () => {
    render(<DiscWheel percent={FACILITANT_PROFILE} />)
    const zone = screen.getByRole('button', { name: 'Zone Directif (trait D Dominant)' })

    fireEvent.mouseEnter(zone)
    const popover = screen.getByRole('tooltip')
    expect(within(popover).getByText('Directif')).toBeInTheDocument()
    expect(within(popover).getByText('D · Dominant')).toBeInTheDocument()
    expect(within(popover).queryByText('Votre profil se situe ici')).not.toBeInTheDocument()
    expect(zone).toHaveAttribute('aria-describedby', popover.id)

    fireEvent.mouseLeave(zone)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  test('la zone du candidat le signale ; Échap ferme la carte au clavier', () => {
    render(<DiscWheel percent={FACILITANT_PROFILE} />)
    const zone = screen.getByRole('button', {
      name: 'Zone Facilitant (traits I Influent + S Stable)',
    })

    fireEvent.focus(zone)
    const popover = screen.getByRole('tooltip')
    expect(within(popover).getByText('Votre profil se situe ici')).toBeInTheDocument()
    expect(within(popover).getByText('I · Influent')).toBeInTheDocument()
    expect(within(popover).getByText('S · Stable')).toBeInTheDocument()

    fireEvent.keyDown(zone, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  test('le point du candidat est placé et explique sa position', () => {
    render(<DiscWheel percent={FACILITANT_PROFILE} />)
    const point = screen.getByRole('button', { name: /^Votre position : zone Facilitant/ })
    expect(point).toBe(screen.getByTestId('disc-wheel-point'))

    fireEvent.click(point)
    expect(within(screen.getByRole('tooltip')).getByText('Votre position')).toBeInTheDocument()
    expect(screen.getByTestId('disc-wheel-reading')).toHaveTextContent(
      'Votre profil se situe dans la zone Facilitant'
    )
  })

  test('scores égaux : profil équilibré, aucune zone signalée', () => {
    render(<DiscWheel percent={{ D: 50, I: 50, S: 50, C: 50 }} />)
    expect(screen.getByTestId('disc-wheel-reading')).toHaveTextContent('Votre profil est équilibré')
    expect(
      screen.getByRole('button', { name: 'Votre position : profil équilibré' })
    ).toBeInTheDocument()

    fireEvent.mouseEnter(screen.getByRole('button', { name: /^Zone Expansif/ }))
    expect(screen.queryByText('Votre profil se situe ici')).not.toBeInTheDocument()
  })

  test('un toucher (mouseenter, focus puis click) ouvre la carte sans la refermer', () => {
    render(<DiscWheel percent={FACILITANT_PROFILE} />)
    const zone = screen.getByRole('button', { name: 'Zone Directif (trait D Dominant)' })

    fireEvent.mouseEnter(zone)
    fireEvent.focus(zone)
    fireEvent.click(zone)
    expect(within(screen.getByRole('tooltip')).getByText('Directif')).toBeInTheDocument()

    // Un second toucher sur la même zone la laisse ouverte.
    fireEvent.click(zone)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  test('toucher une autre zone remplace la carte', () => {
    render(<DiscWheel percent={FACILITANT_PROFILE} />)
    const directif = screen.getByRole('button', { name: 'Zone Directif (trait D Dominant)' })
    const expansif = screen.getByRole('button', { name: /^Zone Expansif/ })

    fireEvent.mouseEnter(directif)
    fireEvent.focus(directif)
    fireEvent.click(directif)
    fireEvent.mouseLeave(directif)
    fireEvent.blur(directif)
    fireEvent.mouseEnter(expansif)
    fireEvent.focus(expansif)
    fireEvent.click(expansif)

    expect(within(screen.getByRole('tooltip')).getByText('Expansif')).toBeInTheDocument()
  })

  test('quitter une zone survolée revient à la zone qui a le focus', () => {
    render(<DiscWheel percent={FACILITANT_PROFILE} />)
    const focused = screen.getByRole('button', { name: /^Zone Facilitant/ })
    const hovered = screen.getByRole('button', { name: /^Zone Directif/ })

    fireEvent.focus(focused)
    fireEvent.mouseEnter(hovered)
    expect(within(screen.getByRole('tooltip')).getByText('Directif')).toBeInTheDocument()

    fireEvent.mouseLeave(hovered)
    expect(within(screen.getByRole('tooltip')).getByText('Facilitant')).toBeInTheDocument()

    fireEvent.mouseLeave(screen.getByTestId('disc-wheel'))
    expect(within(screen.getByRole('tooltip')).getByText('Facilitant')).toBeInTheDocument()

    fireEvent.blur(focused)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  test('le panneau mobile a toujours sa place et montre la zone touchée', () => {
    render(<DiscWheel percent={FACILITANT_PROFILE} />)
    const panel = screen.getByTestId('disc-wheel-panel')
    expect(panel).toHaveAttribute('aria-hidden', 'true')
    expect(panel).toHaveTextContent('Touchez une zone ou le point pour afficher sa description.')

    fireEvent.click(screen.getByRole('button', { name: /^Zone Coopératif/ }))
    expect(panel).toHaveTextContent('Coopératif')
    expect(panel).not.toHaveTextContent('Touchez une zone')
  })

  test('au clavier, Entrée et Espace gardent la carte ouverte après le focus', () => {
    render(<DiscWheel percent={FACILITANT_PROFILE} />)
    const zone = screen.getByRole('button', { name: /^Zone Expansif/ })
    expect(zone).not.toHaveAttribute('aria-expanded')

    fireEvent.focus(zone)
    fireEvent.keyDown(zone, { key: 'Enter' })
    expect(within(screen.getByRole('tooltip')).getByText('Expansif')).toBeInTheDocument()

    fireEvent.keyDown(zone, { key: ' ' })
    expect(within(screen.getByRole('tooltip')).getByText('Expansif')).toBeInTheDocument()
  })
})
