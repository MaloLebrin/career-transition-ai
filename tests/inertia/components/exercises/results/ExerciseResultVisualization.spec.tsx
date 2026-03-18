import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ExerciseResultVisualization from '../../../../../inertia/components/exercises/ExerciseResultVisualization'
import { EXERCICE_RESULTS_TYPES } from '../../../../../shared/constants/exercises'

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  RadarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="radar-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  Radar: () => <div data-testid="radar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ReferenceLine: () => <div data-testid="reference-line" />,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
}))

const baseResult = {
  id: 1,
  date: '2024-05-10',
  duration: 300,
  quantitativeScore: 80,
}

describe('ExerciseResultVisualization', () => {
  test('renders SkillMappingResultView for SKILL_MAPPING type', () => {
    const result = {
      ...baseResult,
      type: EXERCICE_RESULTS_TYPES.SKILL_MAPPING,
      data: { jobTitle: 'Développeur', mapping: [] },
    }
    render(<ExerciseResultVisualization result={result} />)

    expect(screen.getByText('Développeur')).toBeInTheDocument()
    expect(screen.getByText('Poste analysé')).toBeInTheDocument()
  })

  test('renders LifeCurveResultView for LIFE_CURVE type', () => {
    const result = {
      ...baseResult,
      type: EXERCICE_RESULTS_TYPES.LIFE_CURVE,
      data: { points: [], reflection: {} },
    }
    render(<ExerciseResultVisualization result={result} />)

    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  test('renders DiscResultView for DISC type', () => {
    const result = {
      ...baseResult,
      type: EXERCICE_RESULTS_TYPES.DISC,
      data: { D: 50, I: 60, S: 70, C: 80 },
    }
    render(<ExerciseResultVisualization result={result} />)

    expect(screen.getByTestId('radar-chart')).toBeInTheDocument()
  })

  test('renders CircleOfControlResultView for CIRCLE_OF_CONTROL type', () => {
    const result = {
      ...baseResult,
      type: EXERCICE_RESULTS_TYPES.CIRCLE_OF_CONTROL,
      data: { inControl: ['Test'], outControl: ['Autre'] },
    }
    render(<ExerciseResultVisualization result={result} />)

    expect(screen.getByText('Sous contrôle')).toBeInTheDocument()
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  test('renders TargetingResultView for TARGETING type', () => {
    const result = {
      ...baseResult,
      type: EXERCICE_RESULTS_TYPES.TARGETING,
      data: { targets: [] },
    }
    render(<ExerciseResultVisualization result={result} />)

    expect(screen.getByText('Aucune cible enregistrée.')).toBeInTheDocument()
  })

  test('renders DefaultResultView for unknown type', () => {
    const result = {
      ...baseResult,
      type: 'unknown_type' as any,
      data: { custom: 'data' },
    }
    render(<ExerciseResultVisualization result={result} />)

    expect(screen.getByText(/"custom": "data"/, { exact: false })).toBeInTheDocument()
  })

  test('handles null data gracefully', () => {
    const result = {
      ...baseResult,
      type: EXERCICE_RESULTS_TYPES.SKILL_MAPPING,
      data: null,
    }
    expect(() => render(<ExerciseResultVisualization result={result} />)).not.toThrow()
  })

  test('handles uppercase type from database', () => {
    const result = {
      ...baseResult,
      type: 'LIFE_CURVE' as any,
      data: { points: [], reflection: {} },
    }
    render(<ExerciseResultVisualization result={result} />)

    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })
})
