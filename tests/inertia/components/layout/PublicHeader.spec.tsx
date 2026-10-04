import { beforeEach, describe, expect, test, vi } from 'vitest'
import { screen } from '@testing-library/react'
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

  test('renders the individuals navigation with the current page marked', () => {
    setPageProps({}, '/tarifs')
    renderWithUser(<PublicHeader />)

    expect(screen.getByRole('navigation', { name: 'Navigation principale' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Le parcours' })).toHaveAttribute('href', '/#parcours')
    expect(screen.getByRole('link', { name: 'Tarif' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Cabinets' })).toHaveAttribute('href', '/cabinets')
    expect(screen.getByRole('link', { name: 'Cabinets' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('link', { name: 'Se connecter' })).toHaveAttribute(
      'href',
      '/auth/login'
    )
    expect(screen.getByRole('link', { name: 'Accueil' })).toHaveAttribute('href', '/')
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

  test('cabinet header: cabinet navigation and demo action', () => {
    setPageProps({ b2cRegistrationEnabled: true }, '/cabinets/tarifs')
    renderWithUser(<PublicHeader {...CABINET_HEADER} />)

    expect(screen.getByRole('link', { name: 'Offre' })).toHaveAttribute('href', '/offre')
    expect(screen.getByRole('link', { name: 'Tarifs' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Particuliers' })).toHaveAttribute('href', '/')
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
    expect(screen.queryByRole('link', { name: 'Offre' })).not.toBeInTheDocument()
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
