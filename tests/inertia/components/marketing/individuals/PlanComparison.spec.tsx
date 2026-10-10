import { describe, expect, test } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { PlanComparison } from '../../../../../inertia/components/marketing/individuals/PlanComparison'

describe('PlanComparison', () => {
  test('free exercises are included in both columns, the synthesis only with the plan', () => {
    render(<PlanComparison />)
    const table = screen.getByRole('table', { name: /gratuitement et avec le forfait/ })
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((th) => th.textContent)
    ).toEqual(['Ce qui est inclus', 'Gratuit', 'Forfait'])

    const free = screen.getByRole('row', { name: /Analyse Motivations et Recherche de Valeurs/ })
    expect(within(free).getAllByText('Inclus')).toHaveLength(2)

    const synthesis = screen.getByRole('row', { name: /Synthèse de parcours/ })
    expect(within(synthesis).getByText('Non inclus')).toBeInTheDocument()
    expect(within(synthesis).getByText('Inclus')).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /Les 6 autres exercices/ })).toBeInTheDocument()
  })
})
