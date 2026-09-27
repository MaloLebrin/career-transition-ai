import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'

import Breadcrumb from '~/components/ui/Breadcrumb'
import { resetInertiaMock } from '../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../support/inertia_mock')
  return inertiaMock()
})

describe('Breadcrumb', () => {
  beforeEach(() => resetInertiaMock())

  test('ne rend rien sans élément', () => {
    const { container } = render(<Breadcrumb items={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  test('liens pour les éléments intermédiaires, texte simple pour le dernier', () => {
    render(
      <Breadcrumb
        className="mb-4"
        items={[
          { label: 'Accueil', href: '/dashboard' },
          { label: 'Accompagnés', href: '/dashboard/conseiller/employees' },
          { label: 'Sans lien' },
          { label: 'Camille Martin', href: '/ignored' },
        ]}
      />
    )

    const nav = screen.getByRole('navigation', { name: "Fil d'Ariane" })
    expect(nav).toHaveClass('mb-4')
    const items = within(nav).getAllByRole('listitem')
    expect(items).toHaveLength(4)

    expect(screen.getByRole('link', { name: 'Accueil' })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('link', { name: 'Accompagnés' })).toHaveAttribute(
      'href',
      '/dashboard/conseiller/employees'
    )
    expect(screen.queryByRole('link', { name: 'Sans lien' })).not.toBeInTheDocument()
    // Le dernier élément n'est jamais un lien, même avec un href
    expect(screen.queryByRole('link', { name: 'Camille Martin' })).not.toBeInTheDocument()
    expect(screen.getByText('Camille Martin')).toBeInTheDocument()
  })
})
