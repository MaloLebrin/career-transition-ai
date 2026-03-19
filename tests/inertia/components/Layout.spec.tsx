import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import Layout from '../../../inertia/components/layout/Layout'

vi.mock('@inertiajs/react', () => ({
  usePage: vi.fn(() => ({ props: { flash: undefined } })),
}))

describe('Layout', () => {
  const defaultProps = {
    userRole: 'advisor' as const,
    onRoleChange: () => {},
    onLogout: vi.fn(),
    userName: 'Test User',
  }

  test('renders header with brand title and subtitle', () => {
    render(
      <Layout {...defaultProps}>
        <div data-testid="content">Dashboard content</div>
      </Layout>
    )

    expect(screen.getByText('France Transition Carrière')).toBeInTheDocument()
    expect(screen.getByText('Accompagnement Expert')).toBeInTheDocument()
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  test('renders footer mention', () => {
    render(
      <Layout {...defaultProps}>
        <div>Content</div>
      </Layout>
    )
    expect(
      screen.getByText(/France Transition Carrière .* Clarté Stratégique Humaine/)
    ).toBeInTheDocument()
  })

  test('clicking Quitter opens logout confirmation modal', () => {
    const onLogout = vi.fn()
    render(
      <Layout {...defaultProps} onLogout={onLogout}>
        <div>Content</div>
      </Layout>
    )

    const quitButton = screen.getByRole('button', { name: /Quitter/i })
    fireEvent.click(quitButton)

    expect(screen.getByRole('dialog', { name: /Déconnexion/i })).toBeInTheDocument()
    expect(screen.getByText(/Êtes-vous sûr de vouloir vous déconnecter/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Annuler/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Se déconnecter/i })).toBeInTheDocument()
    expect(onLogout).not.toHaveBeenCalled()
  })

  test('clicking Annuler in modal closes it and does not call onLogout', () => {
    const onLogout = vi.fn()
    render(
      <Layout {...defaultProps} onLogout={onLogout}>
        <div>Content</div>
      </Layout>
    )

    fireEvent.click(screen.getByRole('button', { name: /Quitter/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Annuler/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onLogout).not.toHaveBeenCalled()
  })

  test('clicking Se déconnecter in modal closes it and calls onLogout', async () => {
    const onLogout = vi.fn()
    render(
      <Layout {...defaultProps} onLogout={onLogout}>
        <div>Content</div>
      </Layout>
    )

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Quitter/i }))
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Se déconnecter/i }))
    })

    // La modale doit se fermer avant ou pendant l'appel logout.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onLogout).toHaveBeenCalledTimes(1)
  })
})
