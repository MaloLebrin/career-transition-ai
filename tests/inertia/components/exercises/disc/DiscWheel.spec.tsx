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
})
