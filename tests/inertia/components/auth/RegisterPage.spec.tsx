import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RegisterPage from '../../../../inertia/components/auth/RegisterPage'

const defaultProps = {
  onAuthSuccess: vi.fn(),
  onBackToLanding: vi.fn(),
  onGoToLogin: vi.fn(),
  register: vi.fn().mockResolvedValue(undefined),
  error: null as string | null,
}

describe('RegisterPage', () => {
  test('renders register form with title and fields', () => {
    render(<RegisterPage {...defaultProps} />)

    expect(screen.getByText('Création de compte')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Jean Dupont/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/votre@email/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Créer mon compte/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Salarié/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Conseiller/ })).toBeInTheDocument()
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

  test('toggles role when Salarié and Conseiller are clicked', () => {
    render(<RegisterPage {...defaultProps} />)
    const employeeBtn = screen.getByRole('button', { name: /Salarié/ })
    const advisorBtn = screen.getByRole('button', { name: /Conseiller/ })

    expect(employeeBtn).toHaveClass('border-brand-sage')
    fireEvent.click(advisorBtn)
    expect(advisorBtn).toHaveClass('border-brand-sage')
    fireEvent.click(employeeBtn)
    expect(employeeBtn).toHaveClass('border-brand-sage')
  })

  test('shows validation errors and does not call register when name is empty', async () => {
    const register = vi.fn().mockResolvedValue(undefined)
    render(<RegisterPage {...defaultProps} register={register} />)

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
    expect(register).not.toHaveBeenCalled()
  })

  test('shows validation error when email is invalid', async () => {
    const register = vi.fn().mockResolvedValue(undefined)
    render(<RegisterPage {...defaultProps} register={register} />)

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
      expect(screen.getByText((content) => content.includes("pas valide") && content.includes("email"))).toBeInTheDocument()
    })
    expect(register).not.toHaveBeenCalled()
  })

  test('shows validation error when password is too short', async () => {
    const register = vi.fn().mockResolvedValue(undefined)
    render(<RegisterPage {...defaultProps} register={register} />)

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
    expect(register).not.toHaveBeenCalled()
  })

  test('calls register and onAuthSuccess when form is valid (employee)', async () => {
    const register = vi.fn().mockResolvedValue(undefined)
    render(
      <RegisterPage
        {...defaultProps}
        register={register}
        onAuthSuccess={defaultProps.onAuthSuccess}
      />
    )

    fireEvent.change(screen.getByPlaceholderText(/Jean Dupont/), {
      target: { value: 'Jean Dupont' },
    })
    fireEvent.change(screen.getByPlaceholderText(/votre@email/), {
      target: { value: 'jean@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), {
      target: { value: 'password1' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Créer mon compte/ }))

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith('jean@example.com', 'password1', 'Jean Dupont', 'employee')
    })
    expect(defaultProps.onAuthSuccess).toHaveBeenCalled()
  })

  test('calls register with role advisor when Conseiller is selected', async () => {
    const register = vi.fn().mockResolvedValue(undefined)
    render(
      <RegisterPage
        {...defaultProps}
        register={register}
        onAuthSuccess={defaultProps.onAuthSuccess}
      />
    )

    fireEvent.change(screen.getByPlaceholderText(/Jean Dupont/), {
      target: { value: 'Jean Dupont' },
    })
    fireEvent.change(screen.getByPlaceholderText(/votre@email/), {
      target: { value: 'jean@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), {
      target: { value: 'password1' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Conseiller/ }))
    fireEvent.click(screen.getByRole('button', { name: /Créer mon compte/ }))

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith('jean@example.com', 'password1', 'Jean Dupont', 'advisor')
    })
  })

  test('uses PublicLayout with back to landing', () => {
    render(<RegisterPage {...defaultProps} />)
    expect(screen.getByText(/Retour à l'accueil/)).toBeInTheDocument()
  })
})
