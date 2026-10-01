import { beforeEach, describe, expect, test, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { MobileMenu } from '../../../../inertia/components/layout/MobileMenu'
import { resetInertiaMock, routerSpies } from '../../support/inertia_mock'
import { renderWithUser } from '../../support/render'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../support/inertia_mock')
  return inertiaMock()
})

const items = [
  { label: 'Offre', href: '/offre' },
  { label: 'Tarifs', href: '/tarifs' },
]

describe('MobileMenu', () => {
  beforeEach(() => resetInertiaMock())

  test('renders nothing when closed', () => {
    renderWithUser(<MobileMenu open={false} onClose={() => {}} items={items} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('lists the links and actions, closes on the close button and on navigation', async () => {
    const onClose = vi.fn()
    const { user } = renderWithUser(
      <MobileMenu
        open
        onClose={onClose}
        items={items}
        primaryAction={{ label: 'Demander une démo', href: '/#demo' }}
        secondaryAction={{ label: 'Se connecter', href: '/auth/login' }}
      />
    )

    expect(screen.getByRole('link', { name: 'Tarifs' })).toHaveAttribute('href', '/tarifs')
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
