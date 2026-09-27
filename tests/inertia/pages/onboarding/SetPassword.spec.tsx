import { beforeEach, describe, expect, test, vi } from 'vitest'
import { screen } from '@testing-library/react'

import SetPassword from '~/pages/onboarding/SetPassword'
import { formSubmissions, resetInertiaMock, setInertiaOutcome } from '../../support/inertia_mock'
import { renderWithUser } from '../../support/render'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../support/inertia_mock')
  return inertiaMock()
})

describe('SetPassword (onboarding)', () => {
  beforeEach(() => resetInertiaMock())

  test('accueille l’utilisateur par son nom', () => {
    renderWithUser(<SetPassword token="tok-123" userName="Camille" />)
    expect(screen.getByRole('heading', { name: 'Bienvenue, Camille' })).toBeInTheDocument()
  })

  test('envoie les deux mots de passe vers /onboarding/:token', async () => {
    const { user } = renderWithUser(<SetPassword token="tok-123" userName="Camille" />)

    await user.type(screen.getByPlaceholderText('Minimum 8 caractères'), 'SuperSecret1')
    await user.type(screen.getByPlaceholderText('Repétez le mot de passe'), 'SuperSecret1')
    await user.click(screen.getByRole('button', { name: /Créer mon mot de passe/ }))

    expect(formSubmissions.at(-1)).toMatchObject({
      method: 'post',
      url: '/onboarding/tok-123',
      data: { password: 'SuperSecret1', password_confirmation: 'SuperSecret1' },
    })
    // Requête en cours : bouton désactivé
    expect(screen.getByRole('button', { name: 'Création…' })).toBeDisabled()
  })

  test('affiche les erreurs de validation du serveur', async () => {
    setInertiaOutcome({
      errors: { password: 'Trop court', password_confirmation: 'Ne correspond pas' },
    })
    const { user } = renderWithUser(<SetPassword token="t" userName="Camille" />)

    await user.type(screen.getByPlaceholderText('Minimum 8 caractères'), 'abcdefgh')
    await user.type(screen.getByPlaceholderText('Repétez le mot de passe'), 'abcdefgX')
    await user.click(screen.getByRole('button', { name: /Créer mon mot de passe/ }))

    expect(screen.getByText('Trop court')).toBeInTheDocument()
    expect(screen.getByText('Ne correspond pas')).toBeInTheDocument()
  })
})
