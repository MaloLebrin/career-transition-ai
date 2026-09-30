import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'

import EmployeeHome from '../../../../inertia/components/dashboard/EmployeeHome'
import { stepCompletionFromProgress } from '../../../../inertia/components/dashboard/PlanStepsTimeline'
import type { EmployeeData } from '../../../../inertia/types/employee'
import { makeEmployee } from '../../support/factories'

describe('stepCompletionFromProgress', () => {
  test('returns true when support step is already completed in DB', () => {
    expect(
      stepCompletionFromProgress(
        {
          id: 1,
          completed: true,
          associatedExercises: ['LIFE_CURVE'],
        } as EmployeeData['plan'][number],
        { life_curve: 0 }
      )
    ).toBe(true)
  })

  test('returns true when all associated exercises reach 100% progress (slug case-insensitive)', () => {
    expect(
      stepCompletionFromProgress(
        {
          id: 1,
          completed: false,
          associatedExercises: ['LIFE_CURVE'],
        } as EmployeeData['plan'][number],
        { life_curve: 100 }
      )
    ).toBe(true)
  })

  test('returns false when an associated exercise is below 100%', () => {
    expect(
      stepCompletionFromProgress(
        {
          id: 1,
          completed: false,
          associatedExercises: ['LIFE_CURVE', 'motivation'],
        } as EmployeeData['plan'][number],
        { life_curve: 100, motivation: 40 }
      )
    ).toBe(false)
  })
})

describe('EmployeeHome roadmap', () => {
  test('shows step checkmark when life_curve progress is 100% though step.completed is false', () => {
    const employee: EmployeeData = {
      id: 1,
      organizationId: 1,
      userId: 1,
      name: 'Hubert Test',
      email: 'h@example.com',
      currentRole: 'Dev',
      targetRole: 'Lead',
      summary: null,
      advisorNotes: null,
      status: 'active',
      onboarded: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      skills: [],
      exercises: [
        {
          id: 1,
          employeeId: 1,
          type: 'life_curve',
          status: 'completed',
          date: '2026-01-01T00:00:00.000Z',
          duration: 10,
          progressPercent: 100,
          quantitativeScore: null,
          qualitativeAnalysis: null,
          data: {},
        },
      ],
      experiences: [],
      educations: [],
      plan: [
        {
          id: 10,
          completed: false,
          isLocked: false,
          associatedExercises: ['LIFE_CURVE'],
          sortOrder: 0,
        },
      ],
    }

    render(
      <EmployeeHome
        employee={employee}
        completedExercises={1}
        totalExercises={8}
        exerciseCompletionPercent={12}
        exerciseProgressByType={{ life_curve: 100 }}
      />
    )

    expect(screen.getByText('✓')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /life curve/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /voir le résultat/i })).toBeInTheDocument()
  })
})

describe('EmployeeHome — contenu', () => {
  const baseProps = {
    completedExercises: 3,
    totalExercises: 8,
    exerciseCompletionPercent: 38,
    exerciseProgressByType: {},
  }

  test('affiche un loader sans accompagné', () => {
    const { container } = render(
      <EmployeeHome {...baseProps} employee={null as unknown as EmployeeData} />
    )
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  test('salue par le prénom, affiche la cible, la progression, les conseils et 5 compétences max', () => {
    render(
      <EmployeeHome
        {...baseProps}
        employee={makeEmployee({
          name: 'Camille Martin',
          targetRole: 'UX designer',
          advisorNotes: 'Mets en avant ta reconversion',
          skills: Array.from({ length: 6 }, (_, i) => ({
            id: i,
            name: `Compétence ${i + 1}`,
            category: null,
            level: (i % 5) + 1,
          })),
        })}
      />
    )

    expect(screen.getByRole('heading', { name: /Hello, Camille/ })).toBeInTheDocument()
    expect(screen.getByText('UX designer')).toBeInTheDocument()
    expect(screen.getByText(/Progression exercices: 38% \(3\/\s*8\)/)).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Progression des exercices' })).toHaveAttribute(
      'aria-valuenow',
      '38'
    )
    expect(screen.getByText('Conseils Expert')).toBeInTheDocument()
    expect(screen.getByText(/Mets en avant ta reconversion/)).toBeInTheDocument()
    expect(screen.getByText('Compétence 5')).toBeInTheDocument()
    expect(screen.queryByText('Compétence 6')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Voir tous les exercices/ })).toHaveAttribute(
      'href',
      '/dashboard/candidat/exercises'
    )
    expect(screen.getByRole('link', { name: /Mon Profil Vitaminé/ })).toHaveAttribute(
      'href',
      '/dashboard/candidat/profile'
    )
    // #70 : la synthèse partagée est accessible depuis l'accueil.
    expect(screen.getByRole('link', { name: /Ma synthèse/ })).toHaveAttribute(
      'href',
      '/dashboard/candidat/synthesis'
    )
  })

  test('masque le bloc conseils sans note du conseiller', () => {
    render(<EmployeeHome {...baseProps} employee={makeEmployee({ advisorNotes: null })} />)
    expect(screen.queryByText('Conseils Expert')).not.toBeInTheDocument()
  })
})
