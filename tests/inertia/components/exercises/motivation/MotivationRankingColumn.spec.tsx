import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MotivationRankingColumn } from '../../../../../inertia/components/exercises/motivation/MotivationRankingColumn'

describe('MotivationRankingColumn', () => {
  test('affiche le titre, le rang réel et le libellé entier', () => {
    render(
      <MotivationRankingColumn
        title="Les 3 dernières"
        tone="apricot"
        items={[
          { rank: 21, label: "La possibilité d'évoluer professionnellement" },
          { rank: 22, label: 'La rémunération' },
        ]}
      />
    )
    expect(screen.getByRole('heading', { name: 'Les 3 dernières' })).toBeInTheDocument()
    const items = screen.getAllByRole('listitem')
    expect(items.map((li) => li.textContent)).toEqual([
      "Rang 21La possibilité d'évoluer professionnellement",
      'Rang 22La rémunération',
    ])
  })

  test('ne rend rien sans élément', () => {
    const { container } = render(<MotivationRankingColumn title="Vide" tone="lake" items={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
