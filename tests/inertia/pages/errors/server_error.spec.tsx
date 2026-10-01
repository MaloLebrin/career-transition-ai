import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'

import ServerError from '~/pages/errors/server_error'

describe('errors/server_error', () => {
  test('rend une page 500 neutre avec retour à l’accueil', () => {
    render(<ServerError />)

    expect(screen.getByText('Erreur 500')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Une erreur est survenue' })
    ).toBeInTheDocument()
    expect(screen.getByText(/Nos équipes sont prévenues/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Retour à l’accueil' })).toHaveAttribute('href', '/')
  })

  test('n’expose jamais le message d’erreur interne', () => {
    render(<ServerError error={{ message: 'ECONNREFUSED postgres:5432 — stack interne' }} />)

    expect(screen.queryByText(/ECONNREFUSED/)).not.toBeInTheDocument()
    expect(screen.queryByText(/stack interne/)).not.toBeInTheDocument()
  })
})
