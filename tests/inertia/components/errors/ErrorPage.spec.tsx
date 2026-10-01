import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'

import { ErrorPage } from '~/components/errors/ErrorPage'

describe('ErrorPage', () => {
  test('affiche le code en sur-titre, le titre en h1 et le message', () => {
    render(<ErrorPage code={404} title="Page introuvable" message="Cette page n’existe pas." />)

    expect(screen.getByText('Erreur 404')).toHaveClass('text-eyebrow')
    expect(screen.getByRole('heading', { level: 1, name: 'Page introuvable' })).toHaveClass(
      'text-display-sm'
    )
    expect(screen.getByText('Cette page n’existe pas.')).toBeInTheDocument()
  })

  test('propose un retour à l’accueil par lien natif (rechargement complet)', () => {
    render(<ErrorPage code={500} title="Erreur" message="Réessayez." />)

    const link = screen.getByRole('link', { name: 'Retour à l’accueil' })
    expect(link).toHaveAttribute('href', '/')
    expect(link).toHaveClass('bg-primary')
  })

  test('affiche le logo et les actions complémentaires', () => {
    render(
      <ErrorPage code={500} title="Erreur" message="Réessayez.">
        <button type="button">Recharger la page</button>
      </ErrorPage>
    )

    expect(screen.getByRole('img')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Recharger la page' })).toBeInTheDocument()
  })
})
