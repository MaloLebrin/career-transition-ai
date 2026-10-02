import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { ExpertRequestForm } from '~/components/dashboard/b2c/ExpertRequestForm'
import { renderWithUser } from '../../../support/render'
import { formSubmissions, resetInertiaMock, setInertiaOutcome } from '../../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../support/inertia_mock')
  return inertiaMock()
})

describe('ExpertRequestForm (#103)', () => {
  beforeEach(() => resetInertiaMock())

  test('message obligatoire et disponibilités optionnelles', () => {
    render(<ExpertRequestForm />)

    expect(screen.getByRole('textbox', { name: /Votre demande/ })).toBeRequired()
    expect(screen.getByRole('textbox', { name: /Vos disponibilités/ })).not.toBeRequired()
    expect(screen.getByText(/2000 caractères maximum/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Envoyer ma demande' })).toBeEnabled()
  })

  test('poste le message et les disponibilités sur la route de dépôt', async () => {
    setInertiaOutcome('pending')
    const { user } = renderWithUser(<ExpertRequestForm />)

    await user.type(
      screen.getByRole('textbox', { name: /Votre demande/ }),
      'Je veux construire mon plan.'
    )
    await user.type(screen.getByRole('textbox', { name: /Vos disponibilités/ }), 'Mardi soir')
    await user.click(screen.getByRole('button', { name: 'Envoyer ma demande' }))

    expect(formSubmissions).toHaveLength(1)
    expect(formSubmissions[0]).toMatchObject({
      method: 'post',
      url: '/dashboard/candidat/expert-requests',
      data: { message: 'Je veux construire mon plan.', availability: 'Mardi soir' },
      options: { preserveScroll: true },
    })
    expect(screen.getByRole('button', { name: /Envoyer ma demande/ })).toHaveAttribute(
      'aria-busy',
      'true'
    )
  })
})
