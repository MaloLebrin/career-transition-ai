import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { ExerciseSaveOverlay } from '../../../../inertia/components/exercises/ExerciseSaveOverlay'

describe('ExerciseSaveOverlay', () => {
  test('n’affiche rien tant que l’enregistrement n’est pas en cours', () => {
    const { container } = render(<ExerciseSaveOverlay open={false} />)
    expect(container).toBeEmptyDOMElement()
  })

  test('annonce une analyse en arrière-plan sans bloquer les clics', () => {
    render(<ExerciseSaveOverlay open />)
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent(/arrière-plan/)
    expect(status).toHaveTextContent(/Vous pouvez continuer/)
    expect(status).toHaveClass('pointer-events-none')
  })
})
