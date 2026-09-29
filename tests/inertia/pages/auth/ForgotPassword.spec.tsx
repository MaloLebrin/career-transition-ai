import { beforeEach, describe, expect, test, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { RATE_LIMIT_ERROR_KEY } from '#shared/helpers/rate_limit'
import ForgotPassword from '~/pages/auth/ForgotPassword'
import {
  formSubmissions,
  resetInertiaMock,
  setInertiaOutcome,
  setPageProps,
} from '../../support/inertia_mock'
import { renderWithUser } from '../../support/render'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../support/inertia_mock')
  return inertiaMock()
})

describe('ForgotPassword (#68)', () => {
  beforeEach(() => resetInertiaMock())

  test('envoie l’e-mail saisi vers /auth/forgot-password', async () => {
    const { user } = renderWithUser(<ForgotPassword />)

    await user.type(screen.getByPlaceholderText('votre@email.fr'), 'claire@example.com')
    await user.click(screen.getByRole('button', { name: 'Recevoir le lien' }))

    expect(formSubmissions.at(-1)).toMatchObject({
      method: 'post',
      url: '/auth/forgot-password',
      data: { email: 'claire@example.com' },
    })
    expect(screen.getByRole('button', { name: 'Envoi…' })).toBeDisabled()
  })

  test('affiche la confirmation neutre renvoyée par le serveur', () => {
    setPageProps({ flash: { success: 'Si un compte correspond à cette adresse, un lien…' } })
    renderWithUser(<ForgotPassword />)

    expect(screen.getByRole('status')).toHaveTextContent('Si un compte correspond')
  })

  test('affiche l’erreur de validation et le message de quota', async () => {
    setInertiaOutcome({
      errors: { email: 'E-mail invalide', [RATE_LIMIT_ERROR_KEY]: 'Trop de demandes.' },
    })
    const { user } = renderWithUser(<ForgotPassword />)

    await user.type(screen.getByPlaceholderText('votre@email.fr'), 'x')
    await user.click(screen.getByRole('button', { name: 'Recevoir le lien' }))

    expect(screen.getByText('E-mail invalide')).toBeInTheDocument()
    expect(screen.getByText('Trop de demandes.')).toHaveAttribute('role', 'alert')
  })

  test('propose le retour à la connexion', () => {
    renderWithUser(<ForgotPassword />)
    expect(screen.getByRole('link', { name: 'Retour à la connexion' })).toHaveAttribute(
      'href',
      '/auth/login'
    )
  })
})
