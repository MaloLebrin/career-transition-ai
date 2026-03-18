import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CircleOfControlResultView from '../../../../../inertia/components/exercises/results/CircleOfControlResultView'

describe('CircleOfControlResultView', () => {
  test('renders without crashing with empty arrays', () => {
    expect(() =>
      render(<CircleOfControlResultView inControl={[]} outControl={[]} />)
    ).not.toThrow()
    expect(screen.getByText('Sous contrôle')).toBeInTheDocument()
    expect(screen.getByText('Hors contrôle')).toBeInTheDocument()
  })

  test('renders inControl items', () => {
    const inControl = ['Mon attitude', 'Mon effort', 'Ma préparation']
    render(<CircleOfControlResultView inControl={inControl} outControl={[]} />)

    expect(screen.getByText('Mon attitude')).toBeInTheDocument()
    expect(screen.getByText('Mon effort')).toBeInTheDocument()
    expect(screen.getByText('Ma préparation')).toBeInTheDocument()
  })

  test('renders outControl items', () => {
    const outControl = ['La météo', 'Les opinions', 'Le passé']
    render(<CircleOfControlResultView inControl={[]} outControl={outControl} />)

    expect(screen.getByText('La météo')).toBeInTheDocument()
    expect(screen.getByText('Les opinions')).toBeInTheDocument()
    expect(screen.getByText('Le passé')).toBeInTheDocument()
  })

  test('renders both lists correctly', () => {
    const inControl = ['Effort']
    const outControl = ['Marché']
    render(<CircleOfControlResultView inControl={inControl} outControl={outControl} />)

    expect(screen.getByText('Effort')).toBeInTheDocument()
    expect(screen.getByText('Marché')).toBeInTheDocument()
  })
})
