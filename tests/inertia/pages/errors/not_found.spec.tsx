import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'

import NotFound from '~/pages/errors/not_found'

describe('errors/not_found', () => {
  test('rend une page 404 avec retour à l’accueil', () => {
    render(<NotFound />)

    expect(screen.getByText('Erreur 404')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Page introuvable' })).toBeInTheDocument()
    expect(screen.getByText('La page demandée n’existe pas ou a été déplacée.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Retour à l’accueil' })).toHaveAttribute('href', '/')
  })
})
