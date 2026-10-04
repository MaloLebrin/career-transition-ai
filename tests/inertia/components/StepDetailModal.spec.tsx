import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import StepDetailModal from '../../../inertia/components/modals/StepDetailModal'
import { ExerciseType } from '../../../inertia/types'

const mockStep = {
  id: 5,
  title: 'Ciblage Organismes',
  description: "Recherche d'organismes de formation.",
  dueDate: '2024-06-05',
  completed: true,
  associatedExercise: ExerciseType.TARGETING,
  lastUpdated: '2024-06-05',
}

const mockOnClose = vi.fn()

describe('StepDetailModal', () => {
  test('renders targeting result as cards, not raw JSON', () => {
    const result = {
      id: '1',
      type: ExerciseType.TARGETING,
      date: '2024-06-05',
      duration: 300,
      data: {
        targets: [
          {
            id: 'a1',
            name: 'AFPA',
            type: 'Organisme de formation',
            comment: 'Leader en France, structuré, idéal pour débuter.',
            advisorComment: 'Très pertinent.',
          },
          {
            id: 'b2',
            name: 'Cegos',
            type: 'Organisme de formation',
            comment: 'Excellence pédagogique, prestige.',
            advisorComment: 'Excellent choix pour formations haut de gamme.',
          },
        ],
      },
    }

    render(
      <StepDetailModal step={mockStep} result={result} onClose={mockOnClose} userRole="advisor" />
    )

    expect(screen.getByText('AFPA')).toBeInTheDocument()
    expect(screen.getByText('Cegos')).toBeInTheDocument()
    expect(screen.getAllByText('Organisme de formation')).toHaveLength(2)
    expect(screen.getByText(/Leader en France/)).toBeInTheDocument()
    expect(screen.getByText(/Excellence pédagogique/)).toBeInTheDocument()
    expect(screen.getAllByText('Note accompagnateur')).toHaveLength(2)

    expect(screen.queryByText(/"targets":/)).not.toBeInTheDocument()
    expect(screen.queryByText(/"name": "AFPA"/)).not.toBeInTheDocument()
  })

  test('renders empty state when targeting result has no targets', () => {
    const result = {
      id: '1',
      type: ExerciseType.TARGETING,
      date: '2024-06-05',
      duration: 0,
      data: { targets: [] },
    }

    render(
      <StepDetailModal step={mockStep} result={result} onClose={mockOnClose} userRole="advisor" />
    )

    expect(screen.getByText('Aucune cible enregistrée.')).toBeInTheDocument()
  })
})
