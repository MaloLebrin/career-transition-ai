import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import ExerciseList from '../../../../../../inertia/pages/dashboard/employee/exercises/List'
import type { ExerciseListEntry } from '../../../../../../shared/constants/exercises'

vi.mock('@inertiajs/react', () => ({
  Head: () => null,
  router: { visit: vi.fn() },
  // Some nested UI components may rely on Link existing.
  Link: ({ href, className, children }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

vi.mock('../../../../../../inertia/hooks/use_auth', () => ({
  useAuth: () => ({
    user: { id: 1, role: 'employee' },
  }),
}))

vi.mock('../../../../../../inertia/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: any) => (
    <div data-testid="layout">{children}</div>
  ),
}))

vi.mock('../../../../../../inertia/components/ui/AppLink', () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={href} data-testid="app-link" {...rest}>
      {children}
    </a>
  ),
}))

const mockExercises: ExerciseListEntry[] = [
  {
    slug: 'motivation',
    title: 'Analyse Motivations',
    description: 'Comparez vos leviers.',
  },
  {
    slug: 'values',
    title: 'Recherche de Valeurs',
    description: 'Identifiez vos valeurs.',
  },
]

describe('Dashboard candidat - Exercise list', () => {
  test('links only to unlocked exercises, and shows locked label otherwise', () => {
    render(
      <ExerciseList
        exercises={mockExercises}
        unlockedExerciseSlugs={['motivation']}
      />
    )

    expect(screen.getByText('Tous les exercices')).toBeInTheDocument()

    const unlockedLink = screen.getByRole('link', {
      name: /Analyse Motivations/i,
    })
    expect(unlockedLink).toHaveAttribute('href', '/dashboard/candidat/exercises/motivation')

    // Locked exercise should not be wrapped into a link.
    expect(
      screen.queryByRole('link', { name: /Recherche de Valeurs/i })
    ).not.toBeInTheDocument()

    expect(screen.getByText('Verrouillé')).toBeInTheDocument()
  })

  test('shows a "Complété" badge for completed exercises', () => {
    render(
      <ExerciseList
        exercises={mockExercises}
        unlockedExerciseSlugs={['motivation', 'values']}
        completedExerciseSlugs={['motivation']}
      />
    )

    expect(screen.getByRole('link', { name: /Analyse Motivations/i })).toBeInTheDocument()
    expect(screen.getByText('Complété')).toBeInTheDocument()
  })
})

