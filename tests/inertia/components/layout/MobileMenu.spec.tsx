import { beforeEach, describe, expect, test, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { Gift } from 'lucide-react'
import { MobileMenu } from '../../../../inertia/components/layout/MobileMenu'
import { resetInertiaMock, routerSpies } from '../../support/inertia_mock'
import { renderWithUser } from '../../support/render'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../support/inertia_mock')
  return inertiaMock()
})

const groups = [
  {
    label: 'Cabinets',
    items: [
      {
        label: 'Offre',
        href: '/offre',
        description: 'Ce que comprend l’offre.',
        icon: Gift,
        tint: 'sun' as const,
      },
      {
        label: 'Tarifs',
        href: '/tarifs',
        description: 'Les formules et leurs prix.',
        icon: Gift,
        tint: 'lake' as const,
      },
    ],
  },
]

describe('MobileMenu', () => {
  beforeEach(() => resetInertiaMock())

  test('renders nothing when closed', () => {
    renderWithUser(<MobileMenu open={false} onClose={() => {}} groups={groups} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('lists the links and actions, closes on the close button and on navigation', async () => {
    const onClose = vi.fn()
    const { user } = renderWithUser(
      <MobileMenu
        open
        onClose={onClose}
        groups={groups}
        url="/tarifs"
        primaryAction={{ label: 'Demander une démo', href: '/#demo' }}
        secondaryAction={{ label: 'Se connecter', href: '/auth/login' }}
      />
    )

    expect(screen.getByRole('region', { name: 'Cabinets' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Tarifs/ })).toHaveAttribute('href', '/tarifs')
    expect(screen.getByRole('link', { name: /Tarifs/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /Offre/ })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('link', { name: 'Demander une démo' })).toHaveAttribute(
      'href',
      '/#demo'
    )
    expect(screen.getByRole('link', { name: 'Se connecter' })).toHaveAttribute(
      'href',
      '/auth/login'
    )
    expect(routerSpies.on).toHaveBeenCalledWith('navigate', onClose)

    await user.click(screen.getByRole('button', { name: 'Fermer le menu' }))
    expect(onClose).toHaveBeenCalled()
  })
})
