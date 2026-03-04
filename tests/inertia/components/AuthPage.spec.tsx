import { describe, test, expect, vi } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import AuthPage from '../../../inertia/components/auth/AuthPage'

const defaultProps = {
  onAuthSuccess: vi.fn(),
  onBackToLanding: vi.fn(),
  login: vi.fn().mockResolvedValue(undefined),
  register: vi.fn().mockResolvedValue(undefined),
  error: null as string | null,
}

describe('AuthPage', () => {
  test('renders login form by default', () => {
    render(<AuthPage {...defaultProps} />)

    expect(screen.getByText(/Connexion/)).toBeInTheDocument()
    expect(screen.getByText(/Heureux de vous revoir/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/votre@email/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Se connecter/ })).toBeInTheDocument()
  })

  test('renders register form when toggled', async () => {
    render(<AuthPage {...defaultProps} />)

    await act(async () => {
      screen.getByRole('button', { name: /S'inscrire gratuitement/ }).click()
    })

    await waitFor(() => {
      expect(screen.getByText(/Création de compte/)).toBeInTheDocument()
    })
    expect(screen.getByPlaceholderText(/Jean Dupont/)).toBeInTheDocument()
  })

  test('displays error when error prop is set', () => {
    render(<AuthPage {...defaultProps} error="Identifiants invalides" />)

    expect(screen.getByText(/Identifiants invalides/)).toBeInTheDocument()
  })

  test('uses PublicLayout with header without action button', () => {
    render(<AuthPage {...defaultProps} />)

    expect(screen.getByText(/Retour à l'accueil/)).toBeInTheDocument()
  })
})
