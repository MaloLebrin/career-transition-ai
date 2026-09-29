import { beforeEach, describe, expect, test, vi } from 'vitest'
import { screen } from '@testing-library/react'

import ResetPassword from '~/pages/auth/ResetPassword'
import { formSubmissions, resetInertiaMock, setInertiaOutcome } from '../../support/inertia_mock'
import { renderWithUser } from '../../support/render'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../support/inertia_mock')
  return inertiaMock()
})

describe('ResetPassword (#68)', () => {
  beforeEach(() => resetInertiaMock())

  test('envoie les deux mots de passe vers /auth/password-reset/:token', async () => {
    const { user } = renderWithUser(<ResetPassword token="tok-123" expired={false} />)

    await user.type(screen.getByPlaceholderText('Minimum 8 caractères'), 'SuperSecret1')
    await user.type(screen.getByPlaceholderText('Répétez le mot de passe'), 'SuperSecret1')
    await user.click(screen.getByRole('button', { name: 'Enregistrer mon mot de passe' }))

    expect(formSubmissions.at(-1)).toMatchObject({
      method: 'post',
      url: '/auth/password-reset/tok-123',
      data: { password: 'SuperSecret1', password_confirmation: 'SuperSecret1' },
    })
  })

  test('affiche les erreurs de validation du serveur', async () => {
    setInertiaOutcome({ errors: { password_confirmation: 'Ne correspond pas' } })
    const { user } = renderWithUser(<ResetPassword token="t" expired={false} />)

    await user.type(screen.getByPlaceholderText('Minimum 8 caractères'), 'SuperSecret1')
    await user.type(screen.getByPlaceholderText('Répétez le mot de passe'), 'SuperSecretX')
    await user.click(screen.getByRole('button', { name: 'Enregistrer mon mot de passe' }))

    expect(screen.getByText('Ne correspond pas')).toBeInTheDocument()
  })

  test('lien invalide : pas de formulaire, propose une nouvelle demande', () => {
    renderWithUser(<ResetPassword token={null} expired={false} />)

    expect(screen.getByRole('heading', { name: 'Lien invalide' })).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Minimum 8 caractères')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Demander un nouveau lien' })).toHaveAttribute(
      'href',
      '/auth/forgot-password'
    )
  })

  test('lien expiré : le dit', () => {
    renderWithUser(<ResetPassword token={null} expired />)
    expect(screen.getByRole('heading', { name: 'Lien expiré' })).toBeInTheDocument()
  })
})
