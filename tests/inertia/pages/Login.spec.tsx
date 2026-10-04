import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Login from '../../../inertia/pages/Login'

const { pageProps } = vi.hoisted(() => ({
  pageProps: { current: {} as Record<string, unknown> },
}))

vi.mock('@inertiajs/react', async (importOriginal) => {
  const actual = (await importOriginal()) as object
  return {
    ...actual,
    Head: () => null,
    router: { visit: vi.fn(), post: vi.fn() },
    usePage: () => ({ url: '/auth/login', props: pageProps.current }),
  }
})

describe('Login page', () => {
  test('affiche « Créer mon compte » vers /inscription quand b2cRegistrationEnabled est vrai (#93)', () => {
    pageProps.current = { csrfToken: 'tok', b2cRegistrationEnabled: true }
    render(<Login />)

    expect(screen.getByRole('link', { name: /créer mon compte/i })).toHaveAttribute(
      'href',
      '/inscription'
    )
  })

  test('masque « Créer mon compte » quand l’inscription B2C est fermée ou absente', () => {
    pageProps.current = { csrfToken: 'tok', b2cRegistrationEnabled: false }
    render(<Login />)
    expect(screen.queryByRole('link', { name: /créer mon compte/i })).not.toBeInTheDocument()

    pageProps.current = { csrfToken: 'tok' }
    render(<Login />)
    expect(screen.queryByRole('link', { name: /créer mon compte/i })).not.toBeInTheDocument()
  })

  test('renvoie vers l’espace cabinet, sans lien direct vers /auth/register', () => {
    pageProps.current = { csrfToken: 'tok', registrationEnabled: true }
    render(<Login />)

    expect(screen.getByRole('link', { name: 'Espace cabinet' })).toHaveAttribute(
      'href',
      '/cabinets'
    )
    expect(
      screen.queryAllByRole('link').filter((link) => link.getAttribute('href') === '/auth/register')
    ).toHaveLength(0)
  })

  test('affiche le message flash (ex. inscriptions fermées)', () => {
    pageProps.current = { flash: { error: 'Les inscriptions sont fermées.' } }
    render(<Login />)

    expect(screen.getByText(/Les inscriptions sont fermées/)).toBeInTheDocument()
  })

  test('transmet le flash de succès (après réinitialisation du mot de passe)', () => {
    pageProps.current = { flash: { success: 'Mot de passe modifié. Vous pouvez vous connecter.' } }
    render(<Login />)

    expect(screen.getByRole('status')).toHaveTextContent('Mot de passe modifié.')
  })
})
