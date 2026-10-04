import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import InvalidToken from '~/pages/onboarding/InvalidToken'
import { resetInertiaMock } from '../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../support/inertia_mock')
  return inertiaMock()
})

describe('InvalidToken (onboarding)', () => {
  beforeEach(() => resetInertiaMock())

  test('lien invalide ou déjà utilisé', () => {
    render(<InvalidToken />)
    expect(screen.getByRole('heading', { name: 'Lien invalide' })).toBeInTheDocument()
    expect(screen.getByText('Ce lien est invalide ou a déjà été utilisé.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Aller à la connexion' })).toHaveAttribute(
      'href',
      '/auth/login'
    )
  })

  test('lien expiré : invite à contacter le conseiller', () => {
    render(<InvalidToken expired />)
    expect(screen.getByRole('heading', { name: 'Lien expiré' })).toBeInTheDocument()
    expect(screen.getByText(/Contactez votre conseiller/)).toBeInTheDocument()
  })
})
