import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import PlanStepsTimeline from '../../../../inertia/components/dashboard/PlanStepsTimeline'

describe('PlanStepsTimeline', () => {
  test('renders steps and linked exercises', () => {
    render(
      <PlanStepsTimeline
        plan={[
          {
            id: 1,
            completed: false,
            isLocked: false,
            sortOrder: 0,
            scheduledAt: null,
            instructions: null,
            associatedExercises: ['DISC'],
          },
          {
            id: 2,
            completed: true,
            isLocked: false,
            sortOrder: 1,
            scheduledAt: null,
            instructions: null,
            associatedExercises: [],
          },
        ] as any}
        exercises={[
          {
            id: 10,
            type: 'disc',
            status: 'draft',
            date: '2026-01-01T00:00:00.000Z',
            quantitativeScore: null,
            progressPercent: 50,
          },
        ] as any}
      />
    )

    expect(screen.getByText('RDV 1')).toBeInTheDocument()
    expect(screen.getByText('RDV 2')).toBeInTheDocument()

    // Exercise chip label: token is turned into text
    expect(screen.getByText('DISC')).toBeInTheDocument()

    // Completed step shows the CTA
    expect(screen.getByText('Voir le résultat →')).toBeInTheDocument()
  })
})

