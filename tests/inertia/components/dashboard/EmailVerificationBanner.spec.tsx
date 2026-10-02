import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import {
  EmailVerificationBanner,
  RESEND_EMAIL_VERIFICATION_URL,
} from '~/components/dashboard/EmailVerificationBanner'
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

function candidate(overrides: Record<string, unknown> = {}) {
  return {
    id: 7,
    organizationId: 1,
    email: 'camille@example.com',
    name: 'Camille Durand',
    role: 'employee',
    accountType: 'b2c',
    emailVerified: false,
    ...overrides,
  }
}

describe('EmailVerificationBanner (#98)', () => {
  beforeEach(() => resetInertiaMock())

  test('invite un particulier non vérifié à confirmer son adresse, sans bloquer le parcours', () => {
    setPageProps({ user: candidate() })

    render(<EmailVerificationBanner />)

    const banner = screen.getByRole('status', { name: 'Confirmez votre adresse e-mail' })
    expect(banner).toHaveTextContent('camille@example.com')
    expect(banner).toHaveTextContent('exercices gratuits')
    expect(banner).toHaveClass('bg-warning-soft')
    expect(screen.getByRole('button', { name: 'Renvoyer le lien' })).toBeEnabled()
  })

  test('« Renvoyer le lien » poste sur la route de renvoi en conservant le défilement', async () => {
    setPageProps({ user: candidate() })
    setInertiaOutcome('pending')
    const { user } = renderWithUser(<EmailVerificationBanner />)

    await user.click(screen.getByRole('button', { name: 'Renvoyer le lien' }))

    expect(formSubmissions).toHaveLength(1)
    expect(formSubmissions[0]).toMatchObject({
      method: 'post',
      url: RESEND_EMAIL_VERIFICATION_URL,
      options: { preserveScroll: true },
    })
    expect(screen.getByRole('button', { name: /Renvoyer le lien/ })).toHaveAttribute(
      'aria-busy',
      'true'
    )
  })

  test('ne rend rien pour un particulier vérifié, un candidat B2B ou sans session', () => {
    setPageProps({ user: candidate({ emailVerified: true }) })
    expect(render(<EmailVerificationBanner />).container).toBeEmptyDOMElement()

    setPageProps({ user: candidate({ accountType: 'b2b' }) })
    expect(render(<EmailVerificationBanner />).container).toBeEmptyDOMElement()

    setPageProps({})
    expect(render(<EmailVerificationBanner />).container).toBeEmptyDOMElement()
  })
})
