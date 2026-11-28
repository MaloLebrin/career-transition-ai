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
  PolarRadiusAxis: ({ domain, ticks }: { domain: [number, number]; ticks: number[] }) => (
    <div
      data-testid="polar-radius-axis"
      data-domain={domain.join('-')}
      data-ticks={ticks.join(',')}
    />
  ),
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

  test('accentue les nuances : échelle du radar resserrée autour des scores', () => {
    render(<DiscResultView scores={{ D: 40, I: 62, S: 55, C: 48 }} />)

    const axis = screen.getByTestId('polar-radius-axis')
    expect(axis).toHaveAttribute('data-domain', '30-70')
    expect(axis).toHaveAttribute('data-ticks', '30,40,50,60,70')
    expect(screen.getByText(/Échelle resserrée de 30 à 70 %/)).toBeInTheDocument()
  })

  test('affiche la roue DISC avec la position du candidat', () => {
    render(<DiscResultView scores={{ D: 20, I: 85, S: 75, C: 25 }} />)

    expect(screen.getByTestId('disc-wheel')).toBeInTheDocument()
    expect(screen.getByTestId('disc-wheel-reading')).toHaveTextContent('zone Facilitant')
  })

  test('deux vues sur une même page gardent des titres de section uniques', () => {
    const scores = { D: 75, I: 60, S: 45, C: 80 }
    render(
      <>
        <DiscResultView scores={scores} />
        <DiscResultView scores={scores} />
      </>
    )
    const radarSections = screen.getAllByRole('region', { name: 'Équilibre des quatre traits' })
    const wheelSections = screen.getAllByRole('region', { name: 'Votre position sur la roue' })
    expect(radarSections).toHaveLength(2)
    expect(wheelSections).toHaveLength(2)
    const ids = [...radarSections, ...wheelSections].map((s) => s.getAttribute('aria-labelledby'))
    expect(new Set(ids).size).toBe(4)
  })
})
