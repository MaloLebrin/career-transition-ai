import { describe, test, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import LifeCurveResultView from '../../../../../inertia/components/exercises/results/LifeCurveResultView'

const POINTS = [
  { year: 2019, satisfaction: 2, label: 'Période de doute' },
  { year: 2017, satisfaction: 8, label: 'Mémoire de master' },
  { year: 2021, satisfaction: 5, label: '' },
  { year: 2024, satisfaction: 9, label: 'Projet de formateur' },
]

describe('LifeCurveResultView (frise)', () => {
  test('moins de deux événements : message, pas de frise', () => {
    const { container } = render(
      <LifeCurveResultView points={[{ year: 2020, satisfaction: 7 }]} reflection={{}} />
    )
    expect(screen.getByText('Pas assez d’événements pour tracer la frise.')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeNull()
  })

  test('données absentes ou invalides : pas de plantage', () => {
    expect(() => render(<LifeCurveResultView points={undefined} reflection={{}} />)).not.toThrow()
  })

  test('frise : surfaces des hauts et des bas, un point d’axe par événement, années', () => {
    const { container } = render(<LifeCurveResultView points={POINTS} reflection={{}} />)
    const svg = screen.getByRole('img', { name: /Frise de 2017 à 2024 : 4 événements/ })
    expect(svg).toHaveAccessibleName(
      'Frise de 2017 à 2024 : 4 événements, 2 au-dessus et 1 au-dessous du niveau neutre.'
    )

    const fills = Array.from(container.querySelectorAll('path')).map((p) => p.getAttribute('fill'))
    expect(fills).toContain('var(--color-tint-blossom)')
    expect(fills).toContain('var(--color-tint-sun)')
    expect(container.querySelectorAll('clipPath')).toHaveLength(2)

    const markers = Array.from(container.querySelectorAll('g[tabindex="0"]'))
    expect(markers).toHaveLength(4)
    expect(markers.map((g) => g.querySelector('title')?.textContent)).toEqual([
      '2017 · Mémoire de master · 8/10',
      '2019 · Période de doute · 2/10',
      '2021 · 5/10',
      '2024 · Projet de formateur · 9/10',
    ])
    ;['2017', '2019', '2021', '2024'].forEach((year) =>
      expect(within(svg as unknown as HTMLElement).getByText(year)).toBeInTheDocument()
    )
  })

  test('légende des événements : année, libellé et niveau, triés', () => {
    render(<LifeCurveResultView points={POINTS} reflection={{}} />)
    const items = within(screen.getByRole('list', { name: 'Événements' })).getAllByRole('listitem')
    expect(items.map((li) => li.textContent)).toEqual([
      '2017Mémoire de master8/10',
      '2019Période de doute2/10',
      '2021Sans libellé5/10',
      '2024Projet de formateur9/10',
    ])
    expect(screen.getByText('Hauts : au-dessus de 5/10')).toBeInTheDocument()
    expect(screen.getByText('Bas : au-dessous de 5/10')).toBeInTheDocument()
  })

  test('réflexion : intitulés des questions, dans l’ordre de l’exercice, réponses vides masquées', () => {
    render(
      <LifeCurveResultView
        points={POINTS}
        reflection={{
          'coherence': 'Totalement.',
          'form': 'En vagues.',
          'surprise': '  ',
          'Point libre': 'Gardé tel quel',
        }}
      />
    )
    const headings = screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent)
    expect(headings).toEqual(['Forme de la courbe', 'Cohérence avec le parcours', 'Point libre'])
    expect(screen.getByText('En vagues.')).toBeInTheDocument()
    expect(screen.queryByText('Surprise')).not.toBeInTheDocument()
  })
})
