import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { ChatComposer } from '../../../../inertia/components/chat/ChatComposer'
import { formSubmissions, resetInertiaMock, setInertiaOutcome } from '../../support/inertia_mock'
import { renderWithUser } from '../../support/render'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../support/inertia_mock')
  return inertiaMock()
})

describe('ChatComposer', () => {
  beforeEach(() => resetInertiaMock())

  test('Entrée envoie le message avec preserveScroll et only, puis vide le champ', async () => {
    setInertiaOutcome('success')
    const { user } = renderWithUser(<ChatComposer postUrl="/dashboard/candidat/chat/messages" />)
    const field = screen.getByLabelText('Votre message')

    await user.type(field, 'Bonjour{Enter}')

    expect(formSubmissions).toHaveLength(1)
    expect(formSubmissions[0]).toMatchObject({
      method: 'post',
      url: '/dashboard/candidat/chat/messages',
      data: { body: 'Bonjour' },
    })
    expect(formSubmissions[0].options).toMatchObject({ preserveScroll: true })
    expect(formSubmissions[0].options.only).toContain('messages')
    expect(field).toHaveValue('')
  })

  test('Maj+Entrée insère un retour à la ligne sans envoyer', async () => {
    const { user } = renderWithUser(<ChatComposer postUrl="/x" />)
    await user.type(screen.getByLabelText('Votre message'), 'a{Shift>}{Enter}{/Shift}b')
    expect(formSubmissions).toHaveLength(0)
    expect(screen.getByLabelText('Votre message')).toHaveValue('a\nb')
  })

  test('n’envoie pas un message vide', async () => {
    const { user } = renderWithUser(<ChatComposer postUrl="/x" />)
    expect(screen.getByRole('button', { name: 'Envoyer' })).toBeDisabled()
    await user.type(screen.getByLabelText('Votre message'), '   {Enter}')
    expect(formSubmissions).toHaveLength(0)
  })

  test('affiche l’erreur de validation du serveur', async () => {
    setInertiaOutcome({ errors: { body: 'Message trop long' } })
    const { user } = renderWithUser(<ChatComposer postUrl="/x" />)
    await user.type(screen.getByLabelText('Votre message'), 'Salut{Enter}')
    expect(await screen.findByText('Message trop long')).toBeInTheDocument()
  })
})
