import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from '../../../../inertia/components/auth/LoginPage'

const defaultProps = {
  onAuthSuccess: vi.fn(),
  onBackToLanding: vi.fn(),
  onGoToRegister: vi.fn(),
  login: vi.fn().mockResolvedValue(undefined),
  error: null as string | null,
}

describe('LoginPage', () => {
  test('renders login form with title and fields', () => {
    render(<LoginPage {...defaultProps} />)

    expect(screen.getByText('Connexion')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/votre@email/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/••••••••/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Se connecter/ })).toBeInTheDocument()
  })

  test('displays error when error prop is set', () => {
    render(<LoginPage {...defaultProps} error="Identifiants invalides" />)
    expect(screen.getByText(/Identifiants invalides/)).toBeInTheDocument()
  })

  test('calls onGoToRegister when "S\'inscrire gratuitement" is clicked', () => {
    render(<LoginPage {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /inscrire gratuitement/i }))
    expect(defaultProps.onGoToRegister).toHaveBeenCalledTimes(1)
  })

  test('shows validation errors and does not call login when email is empty', async () => {
    const login = vi.fn().mockResolvedValue(undefined)
    render(<LoginPage {...defaultProps} login={login} />)

    fireEvent.click(screen.getByRole('button', { name: /Se connecter/ }))

    await waitFor(() => {
      expect(screen.getByText((content) => content.includes('email est requis'))).toBeInTheDocument()
    })
    expect(login).not.toHaveBeenCalled()
  })

  test('shows validation error when email format is invalid', async () => {
    const login = vi.fn().mockResolvedValue(undefined)
    render(<LoginPage {...defaultProps} login={login} />)

    fireEvent.change(screen.getByPlaceholderText(/votre@email/), {
      target: { value: 'not-an-email' },
    })
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), {
      target: { value: 'password1' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Se connecter/ }))

    await waitFor(() => {
      expect(screen.getByText((content) => content.includes("pas valide") && content.includes("email"))).toBeInTheDocument()
    })
    expect(login).not.toHaveBeenCalled()
  })

  test('shows validation error when password is too short', async () => {
    const login = vi.fn().mockResolvedValue(undefined)
    render(<LoginPage {...defaultProps} login={login} />)

    fireEvent.change(screen.getByPlaceholderText(/votre@email/), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), {
      target: { value: '12345' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Se connecter/ }))

    await waitFor(() => {
      expect(screen.getByText(/Le mot de passe doit contenir au moins 6/)).toBeInTheDocument()
    })
    expect(login).not.toHaveBeenCalled()
  })

  test('calls login and onAuthSuccess when form is valid', async () => {
    const login = vi.fn().mockResolvedValue(undefined)
    render(<LoginPage {...defaultProps} login={login} onAuthSuccess={defaultProps.onAuthSuccess} />)

    fireEvent.change(screen.getByPlaceholderText(/votre@email/), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), {
      target: { value: 'password1' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Se connecter/ }))

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('user@example.com', 'password1')
    })
    expect(defaultProps.onAuthSuccess).toHaveBeenCalled()
  })

  test('uses PublicLayout with back to landing', () => {
    render(<LoginPage {...defaultProps} />)
    expect(screen.getByText(/Retour à l'accueil/)).toBeInTheDocument()
  })
})
