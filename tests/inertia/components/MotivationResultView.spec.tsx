import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MotivationResultView from '../../../inertia/components/exercises/MotivationResultView'

const defaultProps = {
  date: '2024-05-10',
  duration: 450,
}

describe('MotivationResultView', () => {
  test('renders without crashing when data.ranked and data.matrix are empty', () => {
    const data = {
      ranked: [],
      scores: {},
      matrix: [],
    }
    expect(() => render(<MotivationResultView data={data} {...defaultProps} />)).not.toThrow()
    expect(screen.getByText('Date de passage')).toBeInTheDocument()
    expect(screen.getByText('10 mai 2024')).toBeInTheDocument()
  })

  test('renders without crashing when data.matrix has incomplete rows', () => {
    const data = {
      ranked: ['La rémunération', 'La qualité de vie'],
      scores: {},
      matrix: [
        [null, 1],
        [0, null],
        // row 2+ missing: matrix[2] is undefined
      ],
    }
    expect(() => render(<MotivationResultView data={data} {...defaultProps} />)).not.toThrow()
    expect(screen.getByText('Date de passage')).toBeInTheDocument()
  })

  test('renders without crashing when data is undefined-like (guards)', () => {
    const data = {
      ranked: undefined as unknown as string[],
      scores: {},
      matrix: undefined as unknown as (number | null)[][],
    }
    expect(() => render(<MotivationResultView data={data} {...defaultProps} />)).not.toThrow()
    expect(screen.getByText('Durée du test')).toBeInTheDocument()
  })

  test('renders date and duration with valid data', () => {
    const data = {
      ranked: ['La rémunération', 'Le développement personnel'],
      scores: {},
      matrix: [],
    }
    render(<MotivationResultView data={data} {...defaultProps} />)
    expect(screen.getByText('10 mai 2024')).toBeInTheDocument()
    expect(screen.getByText('7min 30s')).toBeInTheDocument()
  })

  test('affiche le classement complet, y compris les libellés longs', () => {
    const longLabel = "La possibilité d'évoluer professionnellement"
    const data = {
      ranked: ['La rémunération', longLabel],
      scores: {},
      matrix: [],
    }
    render(<MotivationResultView data={data} {...defaultProps} />)
    expect(screen.getByRole('heading', { name: 'Classement' })).toBeInTheDocument()
    const labels = screen.getAllByText(longLabel)
    expect(labels.length).toBeGreaterThan(0)
    for (const label of labels) {
      expect(label).not.toHaveClass('truncate')
    }
  })
})
