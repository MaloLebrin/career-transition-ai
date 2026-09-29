import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from '../../../../inertia/components/auth/LoginPage'

const defaultProps = {
  csrfToken: 'test-csrf-token',
  error: null as string | null,
  onBackToLanding: vi.fn(),
  onGoToRegister: vi.fn(),
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

  test('hides the register link when onGoToRegister is not provided (registration closed)', () => {
    render(<LoginPage {...defaultProps} onGoToRegister={undefined} />)
    expect(screen.queryByRole('button', { name: /inscrire gratuitement/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/pas encore de compte/)).not.toBeInTheDocument()
  })

  test('shows validation errors when email is empty and does not submit', async () => {
    render(<LoginPage {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /Se connecter/ }))

    await waitFor(() => {
      expect(
        screen.getByText((content) => content.includes('email est requis'))
      ).toBeInTheDocument()
    })
    // Form has action for when valid (backend redirect)
    expect(screen.getByRole('button', { name: /Se connecter/ }).closest('form')).toHaveAttribute(
      'action',
      '/auth/login'
    )
  })

  test('shows validation error when email format is invalid', async () => {
    render(<LoginPage {...defaultProps} />)

    fireEvent.change(screen.getByPlaceholderText(/votre@email/), {
      target: { value: 'not-an-email' },
    })
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), {
      target: { value: 'password1' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Se connecter/ }))

    await waitFor(() => {
      expect(
        screen.getByText((content) => content.includes('pas valide') && content.includes('email'))
      ).toBeInTheDocument()
    })
    const form = screen.getByRole('button', { name: /Se connecter/ }).closest('form')!
    expect(form).toHaveAttribute('action', '/auth/login')
  })

  test('shows validation error when password is too short', async () => {
    render(<LoginPage {...defaultProps} />)

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
  })

  test('form has action and method for backend redirect when valid', () => {
    render(<LoginPage {...defaultProps} />)
    const form = screen.getByRole('button', { name: /Se connecter/ }).closest('form')
    expect(form).toHaveAttribute('action', '/auth/login')
    expect(form?.getAttribute('method')?.toLowerCase()).toBe('post')
    expect(form?.querySelector('input[name="_csrf"]')).toHaveValue('test-csrf-token')
    expect(form?.querySelector('input[name="email"]')).toBeInTheDocument()
    expect(form?.querySelector('input[name="password"]')).toBeInTheDocument()
  })

  test('uses PublicLayout with back to landing', () => {
    render(<LoginPage {...defaultProps} />)
    expect(screen.getByText(/Retour à l'accueil/)).toBeInTheDocument()
  })

  /** #68 : parcours « mot de passe oublié » accessible depuis la connexion. */
  test('propose le lien « Mot de passe oublié ? »', () => {
    render(<LoginPage {...defaultProps} />)
    expect(screen.getByRole('link', { name: 'Mot de passe oublié ?' })).toHaveAttribute(
      'href',
      '/auth/forgot-password'
    )
  })

  test('affiche le message de succès (mot de passe réinitialisé)', () => {
    render(
      <LoginPage {...defaultProps} success="Mot de passe modifié. Vous pouvez vous connecter." />
    )
    expect(screen.getByRole('status')).toHaveTextContent('Mot de passe modifié.')
  })
})
