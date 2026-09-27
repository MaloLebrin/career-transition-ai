import { beforeEach, describe, expect, test, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { RATE_LIMIT_ERROR_KEY } from '#shared/helpers/rate_limit'
import { ContactDemoForm } from '~/components/marketing/ContactDemoForm'
import { formSubmissions, resetInertiaMock, setInertiaOutcome } from '../../support/inertia_mock'
import { renderWithUser } from '../../support/render'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../support/inertia_mock')
  return inertiaMock()
})

async function fillAndSubmit(user: ReturnType<typeof renderWithUser>['user']) {
  await user.type(screen.getByPlaceholderText('Votre nom'), 'Jeanne Martin')
  await user.type(screen.getByPlaceholderText('prenom@cabinet.fr'), 'jeanne@example.com')
  await user.type(
    screen.getByPlaceholderText('Contexte, volume de bilans, nombre de conseillers…'),
    'Bonjour, je souhaite une démonstration.'
  )
  await user.click(screen.getByRole('button', { name: /Demander une démo/ }))
}

describe('ContactDemoForm', () => {
  beforeEach(() => resetInertiaMock())

  test('envoie la demande vers /contact-requests puis affiche la confirmation', async () => {
    setInertiaOutcome('success')
    const { user } = renderWithUser(<ContactDemoForm />)

    await fillAndSubmit(user)

    expect(formSubmissions.at(-1)).toMatchObject({
      method: 'post',
      url: '/contact-requests',
      data: { name: 'Jeanne Martin', email: 'jeanne@example.com', type: 'demo' },
    })
    expect(screen.getByText('Demande envoyée !')).toBeInTheDocument()
  })

  test('rate limiting : affiche le refus au lieu de la confirmation', async () => {
    setInertiaOutcome({
      errors: { [RATE_LIMIT_ERROR_KEY]: 'Trop de tentatives. Réessayez dans 60 minutes.' },
    })
    const { user } = renderWithUser(<ContactDemoForm />)

    await fillAndSubmit(user)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Trop de tentatives. Réessayez dans 60 minutes.'
    )
    expect(screen.queryByText('Demande envoyée !')).not.toBeInTheDocument()
  })
})
