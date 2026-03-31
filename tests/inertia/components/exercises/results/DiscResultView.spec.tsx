import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DiscResultView from '../../../../../inertia/components/exercises/results/DiscResultView'

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  RadarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="radar-chart">{children}</div>
  ),
  Radar: () => <div data-testid="radar" />,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
}))

describe('DiscResultView', () => {
  test('renders without crashing with zero scores', () => {
    const scores = { D: 0, I: 0, S: 0, C: 0 }
    expect(() => render(<DiscResultView scores={scores} />)).not.toThrow()
    expect(screen.getByTestId('radar-chart')).toBeInTheDocument()
    expect(screen.getByText('Dominante')).toBeInTheDocument()
  })

  test('renders with valid scores', () => {
    const scores = { D: 75, I: 60, S: 45, C: 80 }
    render(<DiscResultView scores={scores} />)

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    expect(screen.getByTestId('radar-chart')).toBeInTheDocument()
    expect(screen.getByTestId('radar')).toBeInTheDocument()
    expect(screen.getByText('Secondaire')).toBeInTheDocument()
  })

  test('renders all chart elements', () => {
    const scores = { D: 50, I: 50, S: 50, C: 50 }
    render(<DiscResultView scores={scores} />)

    expect(screen.getByTestId('polar-grid')).toBeInTheDocument()
    expect(screen.getByTestId('polar-angle-axis')).toBeInTheDocument()
    expect(screen.getByTestId('polar-radius-axis')).toBeInTheDocument()
  })
})
