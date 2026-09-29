import { beforeEach, describe, expect, test, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { PasswordForm } from '~/components/profile/PasswordForm'
import { formSubmissions, resetInertiaMock, setInertiaOutcome } from '../../support/inertia_mock'
import { renderWithUser } from '../../support/render'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../support/inertia_mock')
  return inertiaMock()
})

async function fill(user: ReturnType<typeof renderWithUser>['user']) {
  await user.type(
    screen.getByLabelText(/^Mot de passe actuel/, { selector: 'input' }),
    'ancien-mdp'
  )
  await user.type(
    screen.getByLabelText(/^Nouveau mot de passe/, { selector: 'input' }),
    'nouveau-mdp-1'
  )
  await user.type(
    screen.getByLabelText(/^Confirmer le nouveau mot de passe/, { selector: 'input' }),
    'nouveau-mdp-1'
  )
  await user.click(screen.getByRole('button', { name: 'Changer mon mot de passe' }))
}

describe('PasswordForm (#68)', () => {
  beforeEach(() => resetInertiaMock())

  test('envoie un PUT /dashboard/password sans perdre le scroll', async () => {
    const { user } = renderWithUser(<PasswordForm />)

    await fill(user)

    expect(formSubmissions.at(-1)).toMatchObject({
      method: 'put',
      url: '/dashboard/password',
      data: {
        current_password: 'ancien-mdp',
        password: 'nouveau-mdp-1',
        password_confirmation: 'nouveau-mdp-1',
      },
      options: { preserveScroll: true },
    })
  })

  test('vide les champs après un succès', async () => {
    setInertiaOutcome('success')
    const { user } = renderWithUser(<PasswordForm />)

    await fill(user)

    expect(screen.getByLabelText(/^Mot de passe actuel/, { selector: 'input' })).toHaveValue('')
    expect(screen.getByLabelText(/^Nouveau mot de passe/, { selector: 'input' })).toHaveValue('')
  })

  test('affiche les erreurs de champ et vide le mot de passe actuel', async () => {
    setInertiaOutcome({ errors: { password: 'Trop court' } })
    const { user } = renderWithUser(<PasswordForm />)

    await fill(user)

    expect(screen.getByText('Trop court')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Mot de passe actuel/, { selector: 'input' })).toHaveValue('')
    expect(screen.getByLabelText(/^Nouveau mot de passe/, { selector: 'input' })).toHaveValue(
      'nouveau-mdp-1'
    )
  })
})
