import { describe, expect, test } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { EXERCISE_LIST } from '#shared/constants/exercises'
import { ProductMockup } from '~/components/marketing/ProductMockup'

describe('ProductMockup', () => {
  test('est une image décrite, avec les cinq premiers exercices réels', () => {
    render(<ProductMockup />)

    const mockup = screen.getByRole('img', {
      name: /Aperçu du tableau de bord conseiller/,
    })
    expect(mockup).toHaveClass('rounded-2xl', 'shadow-raised')
    for (const exercise of EXERCISE_LIST.slice(0, 5)) {
      expect(within(mockup).getByText(exercise.title)).toBeInTheDocument()
    }
    expect(within(mockup).queryByText(EXERCISE_LIST[5].title)).not.toBeInTheDocument()
  })

  test('affiche les statuts de parcours sans chiffres inventés', () => {
    render(<ProductMockup />)

    expect(screen.getAllByText('Terminé')).toHaveLength(2)
    expect(screen.getByText('En cours')).toBeInTheDocument()
    expect(screen.getAllByText('À faire')).toHaveLength(2)
    expect(screen.getByText('Étape 3 sur 8')).toBeInTheDocument()
  })
})
