import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'

import TooManyRequests from '~/pages/errors/too_many_requests'

describe('errors/too_many_requests', () => {
  test('rend une page 429 avec retour à l’accueil', () => {
    render(<TooManyRequests />)

    expect(screen.getByText('Erreur 429')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Trop de tentatives' })
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Retour à l’accueil' })).toHaveAttribute('href', '/')
  })
})
