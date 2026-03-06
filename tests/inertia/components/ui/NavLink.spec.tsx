import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import NavLink from '../../../../inertia/components/ui/NavLink'

vi.mock('@inertiajs/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@inertiajs/react')>()
  return {
    ...actual,
    usePage: () => ({ url: '/dashboard' }),
  }
})

describe('NavLink', () => {
  test('renders link with label and href', () => {
    render(<NavLink href="/dashboard" icon="dashboard" label="Tableau de bord" />)
    const link = screen.getByRole('link', { name: 'Tableau de bord' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/dashboard')
  })

  test('sets aria-current when active', () => {
    render(<NavLink href="/dashboard" icon="dashboard" label="Dashboard" />)
    expect(screen.getByRole('link')).toHaveAttribute('aria-current', 'page')
  })
})
