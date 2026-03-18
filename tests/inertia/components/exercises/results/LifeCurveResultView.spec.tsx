import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import LifeCurveResultView from '../../../../../inertia/components/exercises/results/LifeCurveResultView'

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ReferenceLine: () => <div data-testid="reference-line" />,
}))

describe('LifeCurveResultView', () => {
  test('renders without crashing with empty data', () => {
    expect(() =>
      render(<LifeCurveResultView points={[]} reflection={{}} />)
    ).not.toThrow()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  test('renders with valid points data', () => {
    const points = [
      { year: 2020, satisfaction: 7 },
      { year: 2021, satisfaction: 8 },
    ]
    render(<LifeCurveResultView points={points} reflection={{}} />)

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  test('renders reflection cards', () => {
    const reflection = {
      'Point fort': 'Résilience',
      'Point à améliorer': 'Communication',
    }
    render(<LifeCurveResultView points={[]} reflection={reflection} />)

    expect(screen.getByText('Point fort')).toBeInTheDocument()
    expect(screen.getByText('Résilience')).toBeInTheDocument()
    expect(screen.getByText('Point à améliorer')).toBeInTheDocument()
    expect(screen.getByText('Communication')).toBeInTheDocument()
  })
})
