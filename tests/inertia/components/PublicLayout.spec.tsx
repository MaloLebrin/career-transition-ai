import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PublicLayout from '../../../inertia/components/layout/PublicLayout'
import { resetInertiaMock } from '../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../support/inertia_mock')
  return inertiaMock()
})

describe('PublicLayout', () => {
  beforeEach(() => resetInertiaMock())

  test('renders wrapper with base classes, header, main and footer', () => {
    render(
      <PublicLayout>
        <span data-testid="child">Contenu public</span>
      </PublicLayout>
    )

    expect(screen.getByText('Contenu public')).toBeInTheDocument()
    const wrapper = screen.getByRole('main').parentElement
    expect(wrapper).toHaveClass('min-h-screen', 'bg-canvas')
    expect(screen.getByRole('navigation', { name: 'Navigation principale' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Se connecter' })[0]).toHaveAttribute(
      'href',
      '/auth/login'
    )
    expect(screen.getByRole('contentinfo')).toHaveTextContent('© 2026 Transition Carrière')
  })

  test('applies optional className to wrapper', () => {
    render(
      <PublicLayout className="lg:flex-row">
        <span data-testid="child">Child</span>
      </PublicLayout>
    )

    expect(screen.getByRole('main').parentElement).toHaveClass('lg:flex-row')
  })

  test('minimal header and no footer for auth screens', () => {
    render(
      <PublicLayout header={{ minimal: true }} footer={false}>
        <span>Child</span>
      </PublicLayout>
    )

    expect(screen.getByRole('link', { name: "Retour à l'accueil" })).toHaveAttribute('href', '/')
    expect(screen.queryByRole('link', { name: 'Se connecter' })).not.toBeInTheDocument()
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
  })
})
