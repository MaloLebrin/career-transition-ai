import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MotivationMatrix from '../../../../../inertia/components/exercises/results/MotivationMatrix'

describe('MotivationMatrix', () => {
  test('renders matrix legend and headers', () => {
    render(<MotivationMatrix matrix={[]} />)
    expect(screen.getByText("Décision (ID Vainqueur)")).toBeInTheDocument()
    expect(screen.getByText('Diagonale (ID 0)')).toBeInTheDocument()
    expect(screen.getByText('01')).toBeInTheDocument()
  })

  test('renders winner cell values from matrix upper triangle', () => {
    const matrix = Array(22)
      .fill(null)
      .map(() => Array(22).fill(null))
    matrix[0][1] = 1

    render(<MotivationMatrix matrix={matrix} />)
    expect(screen.getByTitle(/1\. .* vs 2\./)).toHaveTextContent('2')
  })

  test('handles incomplete matrix rows without crashing', () => {
    const matrix = [[null, 1], [0, null]] as (number | null)[][]
    expect(() => render(<MotivationMatrix matrix={matrix} />)).not.toThrow()
    expect(screen.getByText("Décision (ID Vainqueur)")).toBeInTheDocument()
  })
})

