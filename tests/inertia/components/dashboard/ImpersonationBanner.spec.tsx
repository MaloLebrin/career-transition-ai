import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import {
  ImpersonationBanner,
  LEAVE_IMPERSONATION_URL,
} from '~/components/dashboard/ImpersonationBanner'
import { renderWithUser } from '../../support/render'
import {
  formSubmissions,
  resetInertiaMock,
  setInertiaOutcome,
  setPageProps,
} from '../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../support/inertia_mock')
  return inertiaMock()
})

const advisor = {
  id: 12,
  organizationId: 3,
  email: 'claire@example.com',
  name: 'Claire Conseil',
  role: 'advisor',
  accountType: null,
  emailVerified: true,
}

describe('ImpersonationBanner (#143)', () => {
  beforeEach(() => resetInertiaMock())

  test('rappelle le compte pris et qui l’a pris', () => {
    setPageProps({ user: advisor, impersonation: { impersonatorName: 'Sam Admin' } })

    render(<ImpersonationBanner />)

    const banner = screen.getByRole('status', { name: 'Vous naviguez en tant que Claire Conseil' })
    expect(banner).toHaveTextContent('Sam Admin')
    expect(banner).toHaveClass('bg-info-soft')
    expect(screen.getByRole('button', { name: 'Revenir à mon compte' })).toBeEnabled()
  })

  test('« Revenir à mon compte » poste sur la route de retour', async () => {
    setPageProps({ user: advisor, impersonation: { impersonatorName: 'Sam Admin' } })
    setInertiaOutcome('pending')
    const { user } = renderWithUser(<ImpersonationBanner />)

    await user.click(screen.getByRole('button', { name: 'Revenir à mon compte' }))

    expect(formSubmissions).toHaveLength(1)
    expect(formSubmissions[0]).toMatchObject({ method: 'post', url: LEAVE_IMPERSONATION_URL })
    expect(screen.getByRole('button', { name: /Revenir à mon compte/ })).toHaveAttribute(
      'aria-busy',
      'true'
    )
  })

  test('ne rend rien hors prise d’identité ou sans session', () => {
    setPageProps({ user: advisor })
    expect(render(<ImpersonationBanner />).container).toBeEmptyDOMElement()

    setPageProps({ impersonation: { impersonatorName: 'Sam Admin' } })
    expect(render(<ImpersonationBanner />).container).toBeEmptyDOMElement()
  })
})
