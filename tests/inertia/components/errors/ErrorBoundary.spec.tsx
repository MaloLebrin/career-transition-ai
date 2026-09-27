import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ErrorBoundary } from '../../../../inertia/components/errors/ErrorBoundary'

function Boom(): never {
  throw new Error('rendu cassé')
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // React et le boundary journalisent l'erreur attendue : on garde la sortie propre.
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('affiche ses enfants tant que rien ne casse', () => {
    render(
      <ErrorBoundary>
        <p>Contenu de la page</p>
      </ErrorBoundary>
    )

    expect(screen.getByText('Contenu de la page')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  test("remplace une page cassée par un message au lieu d'une page blanche", () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Une erreur est survenue' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Retour à l’accueil' })).toHaveAttribute('href', '/')
    expect(screen.queryByText('rendu cassé')).not.toBeInTheDocument()
  })

  test('le bouton recharge la page', () => {
    const reload = vi.fn()
    vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, reload })

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Recharger la page' }))

    expect(reload).toHaveBeenCalledOnce()
  })
})
