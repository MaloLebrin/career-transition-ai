import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Layout from '../../../inertia/components/layout/Layout'

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

  test('renders footer mention and calls onLogout when clicking Quitter', async () => {
    const onLogout = vi.fn()

    render(
      <Layout {...defaultProps} onLogout={onLogout}>
        <div>Content</div>
      </Layout>
    )

    expect(
      screen.getByText(/France Transition Carrière .* Clarté Stratégique Humaine/)
    ).toBeInTheDocument()

    const logoutButton = screen.getByRole('button', { name: /Quitter/i })
    logoutButton.click()

    expect(onLogout).toHaveBeenCalledTimes(1)
  })
})
