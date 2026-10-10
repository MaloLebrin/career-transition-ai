import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import PublicHeader from '../../../../inertia/components/layout/PublicHeader'
import { CABINET_HEADER } from '../../../../inertia/config/marketing'
import { resetInertiaMock, setPageProps } from '../../support/inertia_mock'
import { renderWithUser } from '../../support/render'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../support/inertia_mock')
  return inertiaMock()
})

describe('PublicHeader', () => {
  beforeEach(() => resetInertiaMock())

  test('renders the mega-menu tabs, the current group flagged', () => {
    setPageProps({}, '/tarifs')
    renderWithUser(<PublicHeader />)

    expect(screen.getByRole('navigation', { name: 'Navigation principale' })).toBeInTheDocument()
    const tabs = ['Particuliers', 'Cabinets', 'Ressources'].map((name) =>
      screen.getByRole('button', { name })
    )
    expect(tabs[0]).toHaveAttribute('data-current')
    expect(tabs[1]).not.toHaveAttribute('data-current')
    expect(screen.getByRole('link', { name: 'Se connecter' })).toHaveAttribute(
      'href',
      '/auth/login'
    )
    expect(screen.getByRole('link', { name: 'Accueil' })).toHaveAttribute('href', '/')
  })

  test('opens a panel of rich entries, the current page marked', async () => {
    setPageProps({}, '/tarifs')
    const { user } = renderWithUser(<PublicHeader />)

    const tab = screen.getByRole('button', { name: 'Particuliers' })
    expect(tab).toHaveAttribute('aria-expanded', 'false')
    await user.click(tab)

    expect(tab).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: /Le parcours/ })).toHaveAttribute('href', '/#parcours')
    expect(screen.getByRole('link', { name: /Tarif/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText('Deux exercices offerts, puis un forfait unique.')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(tab).toHaveAttribute('aria-expanded', 'false')
  })

  test('the cabinet panel ends with the demo call to action', async () => {
    const { user } = renderWithUser(<PublicHeader />)

    await user.click(screen.getByRole('button', { name: 'Cabinets' }))
    expect(screen.getByRole('link', { name: /Méthodologie/ })).toHaveAttribute(
      'href',
      '/methodologie'
    )
    expect(screen.getByRole('link', { name: 'Demander une démo' })).toHaveAttribute(
      'href',
      '/cabinets#demo'
    )
  })

  test('solidifies once the page has scrolled', () => {
    renderWithUser(<PublicHeader />)
    const header = screen.getByRole('banner')
    expect(header).toHaveAttribute('data-scrolled', 'false')

    Object.defineProperty(window, 'scrollY', { value: 120, configurable: true })
    fireEvent.scroll(window)
    expect(header).toHaveAttribute('data-scrolled', 'true')
    expect(header).toHaveClass('bg-canvas/90')
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
  })

  test('main action: registration when open, waiting list when closed', () => {
    setPageProps({ b2cRegistrationEnabled: true })
    const { unmount } = renderWithUser(<PublicHeader />)
    expect(screen.getByRole('link', { name: 'Commencer gratuitement' })).toHaveAttribute(
      'href',
      '/inscription'
    )
    unmount()

    setPageProps({ b2cRegistrationEnabled: false })
    renderWithUser(<PublicHeader />)
    expect(screen.queryByRole('link', { name: 'Commencer gratuitement' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Être prévenu de l’ouverture' })).toHaveAttribute(
      'href',
      '/#contact'
    )
  })

  test('cabinet header: cabinet tab first and demo action', () => {
    setPageProps({ b2cRegistrationEnabled: true }, '/cabinets/tarifs')
    renderWithUser(<PublicHeader {...CABINET_HEADER} />)

    const tabs = screen.getAllByRole('button').filter((b) => b.hasAttribute('aria-expanded'))
    expect(tabs[0]).toHaveTextContent('Cabinets')
    expect(tabs[0]).toHaveAttribute('data-current')
    expect(screen.getByRole('link', { name: 'Demander une démo' })).toHaveAttribute(
      'href',
      '/cabinets#demo'
    )
    expect(screen.queryByRole('link', { name: 'Commencer gratuitement' })).not.toBeInTheDocument()
  })

  test('opens and closes the mobile menu', async () => {
    const { user } = renderWithUser(<PublicHeader />)

    const toggle = screen.getByRole('button', { name: 'Ouvrir le menu' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await user.click(toggle)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Navigation mobile' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Fermer le menu' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('minimal variant shows only the logo and the home link', () => {
    renderWithUser(<PublicHeader minimal />)

    expect(screen.getByRole('link', { name: "Retour à l'accueil" })).toHaveAttribute('href', '/')
    expect(screen.queryByRole('button', { name: 'Cabinets' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ouvrir le menu' })).not.toBeInTheDocument()
  })

  test('actions can be hidden', () => {
    renderWithUser(<PublicHeader primaryAction={null} secondaryAction={null} />)

    expect(
      screen.queryByRole('link', { name: 'Être prévenu de l’ouverture' })
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Se connecter' })).not.toBeInTheDocument()
  })
})
