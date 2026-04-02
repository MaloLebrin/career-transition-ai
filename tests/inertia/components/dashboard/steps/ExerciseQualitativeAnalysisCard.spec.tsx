import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ExerciseQualitativeAnalysisCard from '../../../../../inertia/components/dashboard/steps/ExerciseQualitativeAnalysisCard'

describe('ExerciseQualitativeAnalysisCard', () => {
  test('renders label and markdown body', () => {
    render(<ExerciseQualitativeAnalysisCard markdown="Hello **world**" />)
    expect(screen.getByText('Analyse IA')).toBeInTheDocument()
    expect(screen.getByText('world')).toBeInTheDocument()
  })

  test('renders optional exercise title when provided', () => {
    render(
      <ExerciseQualitativeAnalysisCard markdown="x" exerciseTitle="Test exercice" />
    )
    expect(screen.getByText('Test exercice')).toBeInTheDocument()
  })

  test('does not render exercise title when omitted', () => {
    render(<ExerciseQualitativeAnalysisCard markdown="Only body" />)
    expect(screen.queryByText('Test exercice')).not.toBeInTheDocument()
  })
})
