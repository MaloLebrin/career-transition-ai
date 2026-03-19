import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ExerciseList from '../../../../../inertia/pages/dashboard/exercises/List'

vi.mock('../../../../../inertia/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Test User', role: 'employee' as const },
  }),
}))

vi.mock('@inertiajs/react', async (importOriginal) => {
  const actual = (await importOriginal()) as object
  return {
    ...actual,
    Head: () => null,
    router: { visit: vi.fn() },
    usePage: () => ({ url: '/dashboard/candidat/exercises', props: {} }),
  }
})

const mockExercises = [
  { slug: 'motivation', title: 'Analyse Motivations', description: 'Comparez vos leviers.' },
  { slug: 'values', title: 'Recherche de Valeurs', description: 'Identifiez vos valeurs.' },
]

const mockResults = [
  { slug: 'motivation', title: 'Analyse Motivations', date: '2024-06-05T10:00:00.000Z', status: 'completed' },
  { slug: 'values', title: 'Recherche de Valeurs', date: '2024-06-01T14:00:00.000Z', status: 'draft' },
]

describe('Exercise list page (dashboard/exercises/List)', () => {
  test('renders candidat context with title and exercise cards', () => {
    render(
      <ExerciseList exercises={mockExercises} context="candidat" />
    )

    expect(screen.getByText('Tous les exercices')).toBeInTheDocument()
    expect(screen.getByText('Analyse Motivations')).toBeInTheDocument()
    expect(screen.getByText('Comparez vos leviers.')).toBeInTheDocument()
    expect(screen.getByText('Recherche de Valeurs')).toBeInTheDocument()
    expect(screen.getByText('Identifiez vos valeurs.')).toBeInTheDocument()

    const motivationLink = screen.getByRole('link', { name: /Analyse Motivations/i })
    expect(motivationLink).toHaveAttribute('href', '/dashboard/candidat/exercises/motivation')
    const valuesLink = screen.getByRole('link', { name: /Recherche de Valeurs/i })
    expect(valuesLink).toHaveAttribute('href', '/dashboard/candidat/exercises/values')
  })

  test('renders conseiller context with results and links to result detail page', () => {
    render(
      <ExerciseList
        results={mockResults}
        context="conseiller"
        employeeId="42"
      />
    )

    expect(screen.getByText('Résultats des exercices')).toBeInTheDocument()
    expect(screen.getByText('Analyse Motivations')).toBeInTheDocument()
    expect(screen.getByText('Recherche de Valeurs')).toBeInTheDocument()

    const motivationLink = screen.getByRole('link', { name: /Analyse Motivations/i })
    expect(motivationLink).toHaveAttribute(
      'href',
      '/dashboard/conseiller/employees/42/exercises/results/motivation'
    )
  })

  test('conseiller with no results shows empty state', () => {
    render(
      <ExerciseList results={[]} context="conseiller" employeeId="42" />
    )
    expect(screen.getByText('Résultats des exercices')).toBeInTheDocument()
    expect(screen.getByText(/Aucun exercice réalisé pour l'instant/)).toBeInTheDocument()
  })

  test('shows Retour link to correct back URL for candidat', () => {
    render(<ExerciseList exercises={mockExercises} context="candidat" />)
    const backLink = screen.getByRole('link', { name: /Retour/i })
    expect(backLink).toHaveAttribute('href', '/dashboard/candidat')
  })

  test('shows Retour link to employee for conseiller', () => {
    render(
      <ExerciseList
        results={mockResults}
        context="conseiller"
        employeeId="7"
      />
    )
    const backLink = screen.getByRole('link', { name: /Retour/i })
    expect(backLink).toHaveAttribute('href', '/dashboard/conseiller/employees/7')
  })
})
