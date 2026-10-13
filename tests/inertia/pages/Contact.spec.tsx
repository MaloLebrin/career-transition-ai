import { describe, test, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { PRIVACY_CONTACT_EMAIL } from '#shared/constants/legal'
import Contact from '../../../inertia/pages/Contact'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../support/inertia_mock')
  return inertiaMock()
})

describe('Contact page', () => {
  test('affiche le titre et le formulaire de contact (variante contact)', () => {
    render(<Contact />)

    expect(
      screen.getByRole('heading', { level: 1, name: /une question \? écrivez-nous/i })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Envoyer le message' })).toBeInTheDocument()
  })

  test('propose l’e-mail, la démo cabinet et la confidentialité', () => {
    render(<Contact />)
    const main = screen.getByRole('main')

    expect(within(main).getByRole('link', { name: PRIVACY_CONTACT_EMAIL })).toHaveAttribute(
      'href',
      `mailto:${PRIVACY_CONTACT_EMAIL}`
    )
    expect(within(main).getByRole('link', { name: 'Demander une démo' })).toHaveAttribute(
      'href',
      '/cabinets#demo'
    )
    expect(
      within(main).getByRole('link', { name: /politique de confidentialité/i })
    ).toHaveAttribute('href', '/confidentialite')
  })
})
