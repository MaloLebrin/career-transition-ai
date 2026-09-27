import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Login from '../../../inertia/pages/Login'

const { pageProps, visit } = vi.hoisted(() => ({
  pageProps: { current: {} as Record<string, unknown> },
  visit: vi.fn(),
}))

vi.mock('@inertiajs/react', async (importOriginal) => {
  const actual = (await importOriginal()) as object
  return {
    ...actual,
    Head: () => null,
    router: { visit, post: vi.fn() },
    usePage: () => ({ url: '/auth/login', props: pageProps.current }),
  }
})

describe('Login page', () => {
  beforeEach(() => {
    visit.mockClear()
  })

  test('affiche le lien d’inscription quand registrationEnabled est vrai', () => {
    pageProps.current = { csrfToken: 'tok', registrationEnabled: true }
    render(<Login />)

    fireEvent.click(screen.getByRole('button', { name: /inscrire gratuitement/i }))
    expect(visit).toHaveBeenCalledWith('/auth/register')
  })

  test('masque le lien d’inscription quand l’inscription est fermée', () => {
    pageProps.current = { csrfToken: 'tok', registrationEnabled: false }
    render(<Login />)

    expect(screen.queryByRole('button', { name: /inscrire gratuitement/i })).not.toBeInTheDocument()
  })

  test('masque le lien si la prop partagée est absente', () => {
    pageProps.current = { csrfToken: 'tok' }
    render(<Login />)

    expect(screen.queryByRole('button', { name: /inscrire gratuitement/i })).not.toBeInTheDocument()
  })

  test('affiche le message flash (ex. inscriptions fermées)', () => {
    pageProps.current = { flash: { error: 'Les inscriptions sont fermées.' } }
    render(<Login />)

    expect(screen.getByText(/Les inscriptions sont fermées/)).toBeInTheDocument()
  })
})
