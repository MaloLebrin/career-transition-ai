import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import { ProfileForm } from '~/components/profile/ProfileForm'
import type { UserSession } from '~/types/auth'
import { formSubmissions, resetInertiaMock, setInertiaOutcome } from '../../support/inertia_mock'
import { renderWithUser } from '../../support/render'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../support/inertia_mock')
  return inertiaMock()
})

const advisor: UserSession = {
  id: 12,
  organizationId: 3,
  email: 'claire@example.com',
  name: 'Claire Conseil',
  role: 'advisor',
  accountType: null,
  emailVerified: true,
}

describe('ProfileForm (#143)', () => {
  beforeEach(() => resetInertiaMock())

  test('prévient qu’une nouvelle adresse doit être confirmée par lien', () => {
    render(<ProfileForm user={advisor} setSuccess={() => {}} />)

    expect(screen.getByText(/qu’après un clic sur le lien de confirmation/)).toBeInTheDocument()
    expect(screen.queryByText(/Confirmation en attente/)).not.toBeInTheDocument()
  })

  test('affiche l’adresse en attente de confirmation', () => {
    render(<ProfileForm user={advisor} setSuccess={() => {}} pendingEmail="neuve@example.com" />)

    expect(screen.getByRole('status')).toHaveTextContent(
      'Confirmation en attente pour neuve@example.com'
    )
  })

  test('envoie la nouvelle adresse puis remet l’adresse actuelle dans le champ', async () => {
    setInertiaOutcome('success')
    const setSuccess = vi.fn()
    const { user } = renderWithUser(<ProfileForm user={advisor} setSuccess={setSuccess} />)
    const email = screen.getByLabelText(/^Email professionnel/, { selector: 'input' })

    await user.clear(email)
    await user.type(email, 'neuve@example.com')
    await user.click(screen.getByRole('button', { name: 'Mettre à jour mon profil' }))

    expect(formSubmissions.at(-1)).toMatchObject({
      method: 'put',
      url: '/dashboard/conseiller/profile',
      data: { name: 'Claire Conseil', email: 'neuve@example.com' },
    })
    await waitFor(() => expect(setSuccess).toHaveBeenCalledWith(true))
    expect(email).toHaveValue('claire@example.com')
  })
})
