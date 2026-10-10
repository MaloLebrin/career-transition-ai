import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import Cabinets from '../../../inertia/pages/Cabinets'
import { resetInertiaMock, setPageProps } from '../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../support/inertia_mock')
  return inertiaMock()
})

describe('Cabinets page', () => {
  beforeEach(() => resetInertiaMock())

  test('rend l’accueil cabinet avec la navigation cabinet', () => {
    render(<Cabinets />)

    expect(
      screen.getByRole('heading', { level: 1, name: /Structurez vos bilans de compétences/ })
    ).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Navigation principale' })
    const tabs = within(nav)
      .getAllByRole('button', { expanded: false })
      .filter((tab) => tab.hasAttribute('data-headlessui-state'))
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Cabinets', 'Particuliers', 'Ressources'])
    expect(within(nav).getByRole('link', { name: 'Demander une démo' })).toHaveAttribute(
      'href',
      '/cabinets#demo'
    )
  })

  test('propose la création d’un compte cabinet quand l’inscription est ouverte', () => {
    setPageProps({ registrationEnabled: true })
    render(<Cabinets />)

    expect(screen.getByRole('link', { name: 'Créer un compte cabinet' })).toHaveAttribute(
      'href',
      '/auth/register'
    )
  })

  test('masque la création de compte cabinet quand l’inscription est fermée', () => {
    setPageProps({ registrationEnabled: false })
    render(<Cabinets />)

    expect(screen.queryByRole('link', { name: 'Créer un compte cabinet' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Se connecter' }).length).toBeGreaterThan(0)
  })
})
