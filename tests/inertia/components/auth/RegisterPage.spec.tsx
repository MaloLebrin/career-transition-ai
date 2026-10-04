import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RegisterPage from '../../../../inertia/components/auth/RegisterPage'

const defaultProps = {
  csrfToken: 'test-csrf-token',
  onGoToLogin: vi.fn(),
  error: null as string | null,
}

describe('RegisterPage', () => {
  test('renders register form with title and fields', () => {
    render(<RegisterPage {...defaultProps} />)

    expect(screen.getAllByText('Création de compte cabinet')[0]).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Cabinet Horizon Paris/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Jean Dupont/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/votre@email/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Créer mon compte/ })).toBeInTheDocument()
  })

  test('renvoie vers l’inscription particulier seulement quand elle est ouverte', () => {
    const { unmount } = render(<RegisterPage {...defaultProps} candidateRegistrationEnabled />)
    expect(screen.getByRole('link', { name: 'Créer mon compte' })).toHaveAttribute(
      'href',
      '/inscription'
    )
    unmount()

    render(<RegisterPage {...defaultProps} />)
    expect(screen.queryByRole('link', { name: 'Créer mon compte' })).not.toBeInTheDocument()
  })

  test('displays error when error prop is set', () => {
    render(<RegisterPage {...defaultProps} error="Cet email est déjà utilisé" />)
    expect(screen.getByText(/Cet email est déjà utilisé/)).toBeInTheDocument()
  })

  test('calls onGoToLogin when "Se connecter" is clicked', () => {
    render(<RegisterPage {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /^Se connecter$/ }))
    expect(defaultProps.onGoToLogin).toHaveBeenCalledTimes(1)
  })

  test('shows validation errors and does not call register when name is empty', async () => {
    render(<RegisterPage {...defaultProps} />)

    fireEvent.change(screen.getByPlaceholderText(/Cabinet Horizon Paris/), {
      target: { value: 'Mon Cabinet' },
    })
    fireEvent.change(screen.getByPlaceholderText(/votre@email/), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), {
      target: { value: 'password1' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Créer mon compte/ }))

    await waitFor(() => {
      expect(screen.getByText(/Le nom est requis/)).toBeInTheDocument()
    })
  })

  test('shows validation error when email is invalid', async () => {
    render(<RegisterPage {...defaultProps} />)

    fireEvent.change(screen.getByPlaceholderText(/Cabinet Horizon Paris/), {
      target: { value: 'Mon Cabinet' },
    })
    fireEvent.change(screen.getByPlaceholderText(/Jean Dupont/), {
      target: { value: 'Jean Dupont' },
    })
    fireEvent.change(screen.getByPlaceholderText(/votre@email/), {
      target: { value: 'bad-email' },
    })
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), {
      target: { value: 'password1' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Créer mon compte/ }))

    await waitFor(() => {
      expect(
        screen.getByText((content) => content.includes('pas valide') && content.includes('email'))
      ).toBeInTheDocument()
    })
  })

  test('shows validation error when password is too short', async () => {
    render(<RegisterPage {...defaultProps} />)

    fireEvent.change(screen.getByPlaceholderText(/Cabinet Horizon Paris/), {
      target: { value: 'Mon Cabinet' },
    })
    fireEvent.change(screen.getByPlaceholderText(/Jean Dupont/), {
      target: { value: 'Jean Dupont' },
    })
    fireEvent.change(screen.getByPlaceholderText(/votre@email/), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), {
      target: { value: '12345' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Créer mon compte/ }))

    await waitFor(() => {
      expect(screen.getByText(/Le mot de passe doit contenir au moins 6/)).toBeInTheDocument()
    })
  })

  test('uses PublicLayout with back to landing', () => {
    render(<RegisterPage {...defaultProps} />)
    expect(screen.getByText(/Retour à l'accueil/)).toBeInTheDocument()
  })
})
