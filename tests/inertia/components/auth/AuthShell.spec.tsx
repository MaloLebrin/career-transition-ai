import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { AuthShell } from '~/components/auth/AuthShell'
import { resetInertiaMock } from '../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../support/inertia_mock')
  return inertiaMock()
})

describe('AuthShell', () => {
  beforeEach(() => resetInertiaMock())

  test('rend le titre en h1, le sous-titre et le contenu dans l’en-tête minimal', () => {
    render(
      <AuthShell title="Connexion" subtitle="Saisissez vos identifiants.">
        <p>Formulaire</p>
      </AuthShell>
    )

    const heading = screen.getByRole('heading', { level: 1, name: 'Connexion' })
    expect(heading).toHaveClass('text-display-sm')
    expect(screen.getByText('Saisissez vos identifiants.')).toHaveClass('text-muted')
    expect(screen.getByText('Formulaire')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: "Retour à l'accueil" })).toHaveAttribute('href', '/')
    // Pas de footer marketing sur les écrans auth
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
  })

  test('affiche la tuile d’icône soleil par défaut, sur un horizon pastel', () => {
    const { container } = render(
      <AuthShell title="Bienvenue" icon={<svg data-testid="icon" />}>
        <p>Contenu</p>
      </AuthShell>
    )

    const tile = screen.getByTestId('icon').parentElement
    expect(tile).toHaveClass('bg-tint-sun', 'text-ink', 'rounded-xl')
    expect(container.querySelector('.bg-warning-soft')).toBeNull()
    const landscape = container.querySelector('svg[data-variant="horizon"]')
    expect(landscape).toHaveAttribute('aria-hidden', 'true')
    expect(landscape?.parentElement).toHaveClass('absolute', 'bottom-0', 'pointer-events-none')
  })

  test('ton warning + filet apricot pour les liens invalides', () => {
    render(
      <AuthShell
        title="Lien expiré"
        icon={<svg data-testid="icon" />}
        iconTone="warning"
        accent="warm"
      >
        <p>Contenu</p>
      </AuthShell>
    )

    expect(screen.getByTestId('icon').parentElement).toHaveClass('bg-warning-soft', 'text-warning')
    const card = screen.getByRole('heading', { level: 1 }).closest('.rounded-xl')
    expect(card).toHaveClass('border-t-2', 'border-t-tint-apricot-bold')
  })

  test('sans accent, la carte n’a pas de filet apricot', () => {
    render(
      <AuthShell title="Connexion">
        <p>Contenu</p>
      </AuthShell>
    )
    const card = screen.getByRole('heading', { level: 1 }).closest('.rounded-xl')
    expect(card).not.toHaveClass('border-t-tint-apricot-bold')
  })

  test('rend le footer sous un filet hairline, et rien sans footer', () => {
    const { rerender } = render(
      <AuthShell title="Connexion" footer={<span>Pas encore de compte ?</span>}>
        <p>Contenu</p>
      </AuthShell>
    )

    const footer = screen.getByText('Pas encore de compte ?').parentElement
    expect(footer).toHaveClass('border-t', 'border-hairline', 'text-muted')

    rerender(
      <AuthShell title="Connexion">
        <p>Contenu</p>
      </AuthShell>
    )
    expect(screen.queryByText('Pas encore de compte ?')).not.toBeInTheDocument()
  })
})
