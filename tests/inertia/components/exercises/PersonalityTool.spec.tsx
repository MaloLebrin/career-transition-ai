import { describe, expect, test, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'

import PersonalityTool from '~/components/exercises/PersonalityTool'
import { renderWithUser } from '../../support/render'

describe('PersonalityTool', () => {
  test('affiche les 5 traits du Big Five positionnés à 5/10 par défaut', () => {
    renderWithUser(<PersonalityTool onSave={vi.fn()} />)
    expect(screen.getByText('Questionnaire de Personnalité (Big Five)')).toBeInTheDocument()
    expect(screen.getAllByRole('slider')).toHaveLength(5)
    expect(screen.getAllByText('5 / 10')).toHaveLength(5)
    for (const label of [
      "Ouverture d'esprit",
      'Conscience professionnelle',
      'Extraversion',
      'Amabilité',
      'Névrosisme / Stabilité Émotionnelle',
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  test('déplacer un curseur met à jour le score affiché', () => {
    renderWithUser(<PersonalityTool onSave={vi.fn()} />)
    const [openness] = screen.getAllByRole('slider')
    fireEvent.change(openness, { target: { value: '9' } })
    expect(screen.getByText('9 / 10')).toBeInTheDocument()
    expect(screen.getAllByText('5 / 10')).toHaveLength(4)
  })

  test('finaliser transmet les scores et la durée', async () => {
    const onSave = vi.fn()
    const { user } = renderWithUser(<PersonalityTool onSave={onSave} />)
    const sliders = screen.getAllByRole('slider')
    fireEvent.change(sliders[1], { target: { value: '8' } })
    fireEvent.change(sliders[4], { target: { value: '2' } })

    await user.click(screen.getByRole('button', { name: 'Finaliser le profil de personnalité' }))

    expect(onSave).toHaveBeenCalledWith(
      { openness: 5, conscientiousness: 8, extraversion: 5, agreeableness: 5, neuroticism: 2 },
      expect.any(Number)
    )
  })
})
