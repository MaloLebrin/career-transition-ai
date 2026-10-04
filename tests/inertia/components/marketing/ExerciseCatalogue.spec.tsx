import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EXERCISE_LIST } from '#shared/constants/exercises'
import { ExerciseCatalogue } from '~/components/marketing/ExerciseCatalogue'

describe('ExerciseCatalogue', () => {
  test('liste les huit exercices réels de la plateforme dans l’ordre', () => {
    render(<ExerciseCatalogue />)

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(8)
    expect(items).toHaveLength(EXERCISE_LIST.length)
    EXERCISE_LIST.forEach((exercise, index) => {
      expect(screen.getByRole('heading', { level: 3, name: exercise.title })).toBeInTheDocument()
      expect(items[index]).toHaveTextContent(`Exercice ${index + 1}`)
    })
  })

  test('chaque exercice a son icône décorative', () => {
    render(<ExerciseCatalogue />)

    for (const item of screen.getAllByRole('listitem')) {
      const icon = item.querySelector('span[aria-hidden="true"] svg')
      expect(icon).not.toBeNull()
    }
  })
})
