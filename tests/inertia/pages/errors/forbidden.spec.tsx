import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'

import Forbidden from '~/pages/errors/forbidden'

describe('errors/forbidden', () => {
  test('affiche le message du refus et le retour à l’accueil', () => {
    render(<Forbidden message="Accès réservé aux conseillers." />)

    expect(screen.getByText('Erreur 403')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Accès refusé' })).toBeInTheDocument()
    expect(screen.getByText('Accès réservé aux conseillers.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Retour à l’accueil' })).toHaveAttribute('href', '/')
  })

  test('retombe sur un message par défaut', () => {
    render(<Forbidden />)

    expect(screen.getByText('Vous n’avez pas accès à cette page.')).toBeInTheDocument()
  })
})
