import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import AppShell from '../../../inertia/components/layout/AppShell'

const mockLogout = vi.fn()

vi.mock('../../../inertia/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Test User', role: 'advisor' as const },
    logout: mockLogout,
  }),
}))

vi.mock('../../../inertia/hooks/useEmployees', () => ({
  useEmployees: () => ({
    employees: [{ id: 1, name: 'Jean', email: 'jean@example.com' }],
    filteredEmployees: [{ id: 1, name: 'Jean', email: 'jean@example.com' }],
    loading: false,
  }),
}))

vi.mock('../../../inertia/hooks/useEmployee', () => ({
  useEmployee: () => ({
    employee: {
      id: 1,
      name: 'Jean',
      email: 'jean@example.com',
      targetRole: 'Lead',
      skills: [],
      experiences: [],
      exercises: [],
      plan: [],
    },
    refreshEmployee: vi.fn(),
  }),
}))

vi.mock('../../../inertia/hooks/useExercises', () => ({
  useExercises: () => ({
    isAnalyzing: false,
    isSavingDraft: false,
    saveResult: vi.fn(),
    saveDraft: vi.fn(),
    loadDraft: vi.fn(),
  }),
}))

vi.mock('@inertiajs/react', () => ({
  router: {
    put: vi.fn(),
  },
}))

describe('AppShell', () => {
  beforeEach(() => {
    mockLogout.mockReset()
  })

  test('renders inside Layout with navigation for advisor', () => {
    render(<AppShell />)

    // Header brand text from Layout
    expect(screen.getByText('France Transition Carrière')).toBeInTheDocument()
    expect(screen.getByText('Accompagnement Expert')).toBeInTheDocument()

    // Navigation items for advisor
    expect(screen.getByText('Bureau')).toBeInTheDocument()
    expect(screen.getByText('Candidats')).toBeInTheDocument()
    expect(screen.getByText('Réglages')).toBeInTheDocument()
    expect(screen.getByText('Design')).toBeInTheDocument()
  })

  test('calls logout and resets state when clicking Quitter', () => {
    render(<AppShell />)

    const logoutButton = screen.getByRole('button', { name: /Quitter/i })
    logoutButton.click()

    expect(mockLogout).toHaveBeenCalledTimes(1)
  })
})

