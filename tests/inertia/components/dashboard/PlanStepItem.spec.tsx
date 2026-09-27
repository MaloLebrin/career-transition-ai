import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import PlanStepItem from '~/components/dashboard/PlanStepItem'
import type { EmployeeData } from '~/types/employee'
import { resetInertiaMock } from '../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../support/inertia_mock')
  return inertiaMock()
})

type Exercise = EmployeeData['exercises'][number]

const exercise = (overrides: Partial<Exercise>): Exercise => ({
  id: 1,
  type: 'life_curve',
  status: 'completed',
  date: '2024-01-01',
  quantitativeScore: null,
  progressPercent: 0,
  ...overrides,
})

describe('PlanStepItem', () => {
  beforeEach(() => resetInertiaMock())

  test('étape ouverte : numéro, date, consignes et liens vers les exercices avec progression', () => {
    render(
      <PlanStepItem
        index={1}
        stepDone={false}
        isLocked={false}
        step={{
          id: 3,
          sortOrder: null,
          scheduledAt: '2024-05-02T09:30:00.000Z',
          instructions: 'Préparer la courbe de vie',
          completed: false,
          associatedExercises: ['LIFE_CURVE', 'values'],
        }}
        exercises={[
          exercise({ id: 1, type: 'life_curve', date: '2024-01-01', progressPercent: 100 }),
          exercise({ id: 2, type: 'LIFE_CURVE', date: '2024-03-01', progressPercent: 40 }),
          exercise({ id: 3, type: 'life_curve', date: '2024-02-01', progressPercent: 90 }),
          exercise({ id: 4, type: 'values', date: null, progressPercent: null }),
        ]}
      />
    )

    expect(screen.getByRole('heading', { name: 'RDV 2' })).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Préparer la courbe de vie')).toBeInTheDocument()
    expect(screen.queryByText('Verrouillée')).not.toBeInTheDocument()

    const links = screen.getAllByRole('link')
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '/dashboard/candidat/exercises/life_curve',
      '/dashboard/candidat/exercises/values',
    ])
    // La progression retenue est celle du résultat le plus récent
    expect(screen.getByText('40%')).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
    expect(screen.getByText('LIFE CURVE')).toBeInTheDocument()
  })

  test('exercice terminé à 100 % : badge « Complété »', () => {
    render(
      <PlanStepItem
        index={0}
        stepDone={false}
        isLocked={false}
        step={{ id: 1, sortOrder: 4, completed: false, associatedExercises: ['disc'] }}
        exercises={[exercise({ type: 'disc', progressPercent: 100 })]}
      />
    )
    expect(screen.getByRole('heading', { name: 'RDV 5' })).toBeInTheDocument()
    expect(screen.getByText('Complété')).toBeInTheDocument()
  })

  test('étape verrouillée : message de déblocage et exercices désactivés sans lien', () => {
    render(
      <PlanStepItem
        index={2}
        stepDone={false}
        isLocked
        step={{ id: 1, completed: false, associatedExercises: ['motivation'] }}
        exercises={[]}
      />
    )
    expect(screen.getByText('Verrouillée')).toBeInTheDocument()
    expect(screen.getByText('Cette étape sera débloquée par votre conseiller')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /motivation/ })).toBeDisabled()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  test('étape terminée : coche, pas d’exercices et lien vers le résultat', () => {
    render(
      <PlanStepItem
        index={0}
        stepDone
        isLocked={false}
        step={{ id: 7, completed: true, associatedExercises: ['values'] }}
        exercises={[]}
      />
    )
    expect(screen.getByText('✓')).toBeInTheDocument()
    expect(screen.queryByText('values')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Voir le résultat/ })).toHaveAttribute(
      'href',
      '/dashboard/candidat/steps/7'
    )
  })
})
