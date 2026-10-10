import { beforeEach, describe, expect, test, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { PopoverGroup } from '@headlessui/react'
import { MegaMenu, isCurrentPath } from '../../../../inertia/components/layout/MegaMenu'
import { CABINETS_MENU, RESOURCES_MENU } from '../../../../inertia/config/marketing'
import { resetInertiaMock } from '../../support/inertia_mock'
import { renderWithUser } from '../../support/render'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../support/inertia_mock')
  return inertiaMock()
})

describe('isCurrentPath', () => {
  test('matches the page and its sub-pages, never an anchor', () => {
    expect(isCurrentPath('/cabinets/tarifs', '/cabinets')).toBe(true)
    expect(isCurrentPath('/cabinets/tarifs?x=1', '/cabinets/tarifs')).toBe(true)
    expect(isCurrentPath('/offre', '/cabinets')).toBe(false)
    expect(isCurrentPath('/tarifs', '/')).toBe(false)
    expect(isCurrentPath('/', '/')).toBe(true)
    expect(isCurrentPath('/', '/#parcours')).toBe(false)
  })
})

describe('MegaMenu', () => {
  beforeEach(() => resetInertiaMock())

  test('opens with the keyboard and closes when an entry is chosen', async () => {
    const { user } = renderWithUser(
      <PopoverGroup>
        <MegaMenu group={RESOURCES_MENU} url="/securite" />
      </PopoverGroup>
    )

    const tab = screen.getByRole('button', { name: 'Ressources' })
    expect(tab).toHaveAttribute('data-current')
    tab.focus()
    await user.keyboard('{Enter}')

    const entry = screen.getByRole('link', { name: /Sécurité/ })
    expect(entry).toHaveAttribute('aria-current', 'page')
    await user.click(entry)
    expect(tab).toHaveAttribute('aria-expanded', 'false')
  })

  test('a wide group lays its entries on two columns', async () => {
    const { user } = renderWithUser(<MegaMenu group={CABINETS_MENU} url="/" />)

    await user.click(screen.getByRole('button', { name: 'Cabinets' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    expect(screen.getByRole('list')).toHaveClass('grid-cols-2')
  })
})
